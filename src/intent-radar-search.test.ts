import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type IntentSearchConnector,
  type ConnectorResult,
  scanRadarOpportunities,
  RADAR_DEFAULT_QUERIES,
} from './intent-radar-search.js';

class MockConnector implements IntentSearchConnector {
  readonly id: string;
  readonly name: string;
  private results: ConnectorResult;

  constructor(id: string, name: string, results: ConnectorResult) {
    this.id = id;
    this.name = name;
    this.results = results;
  }

  async search(): Promise<ConnectorResult> {
    return this.results;
  }
}

test('RADAR_DEFAULT_QUERIES contém termos estratégicos para salões e barbearias', () => {
  assert.ok(RADAR_DEFAULT_QUERIES.length >= 6);
  assert.ok(RADAR_DEFAULT_QUERIES.some(q => q.includes('salão')));
  assert.ok(RADAR_DEFAULT_QUERIES.some(q => q.includes('barbearia')));
  assert.ok(RADAR_DEFAULT_QUERIES.some(q => q.includes('WhatsApp')));
});

test('scanRadarOpportunities deduplica sinais repetidos por URL e por texto', async () => {
  const c1 = new MockConnector('mock1', 'Mock 1', {
    connectorId: 'mock1',
    connectorName: 'Mock 1',
    signals: [
      {
        sourceUrl: 'https://comunidade.com.br/post/1',
        text: 'Tenho uma barbearia e preciso de sistema de agendamento no WhatsApp urgente.',
      },
      {
        sourceUrl: 'https://comunidade.com.br/post/1?utm_source=twitter',
        text: 'Tenho uma barbearia e preciso de sistema de agendamento no WhatsApp urgente.',
      },
    ],
  });

  const c2 = new MockConnector('mock2', 'Mock 2', {
    connectorId: 'mock2',
    connectorName: 'Mock 2',
    signals: [
      {
        sourceUrl: 'https://comunidade.com.br/post/1',
        text: 'Tenho uma barbearia e preciso de sistema de agendamento no WhatsApp urgente.',
      },
      {
        sourceUrl: 'https://comunidade.com.br/post/2',
        text: 'Sou dona de salão de beleza e perco clientes porque não consigo responder as mensagens no WhatsApp.',
      },
    ],
  });

  const result = await scanRadarOpportunities({
    connectors: [c1, c2],
    includeLowAndDiscarded: true,
  });

  assert.equal(result.totalSignalsCollected, 4);
  assert.equal(result.uniqueSignals, 2);
  assert.equal(result.opportunities.length, 2);
});

test('scanRadarOpportunities ordena oportunidades por prioridade e score', async () => {
  const c = new MockConnector('mock', 'Mock', {
    connectorId: 'mock',
    connectorName: 'Mock',
    signals: [
      {
        sourceUrl: 'https://forum.com/curiosidade',
        text: 'Qual sistema de agendamento pelo WhatsApp vocês recomendam para pequenas empresas?',
      },
      {
        sourceUrl: 'https://forum.com/dono-salão',
        text: 'Tenho um salão de beleza e preciso automatizar o agendamento no WhatsApp. Alguém indica sistema?',
      },
      {
        sourceUrl: 'https://forum.com/barbeiro-desesperado',
        text: 'Sou barbeiro e dono da barbearia. Estou perdendo clientes porque não dou conta de responder o WhatsApp enquanto corto cabelo. Preciso de um sistema ou recepcionista urgente.',
      },
    ],
  });

  const result = await scanRadarOpportunities({
    connectors: [c],
    includeLowAndDiscarded: true,
  });

  assert.ok(result.opportunities.length >= 2);
  const first = result.opportunities[0];
  assert.equal(first.level, 'HIGH');
  assert.equal(first.segment, 'barbearia');
  assert.equal(first.urgency, 'HIGH');
});

test('scanRadarOpportunities reporta limitações de conectores sem derrubar o motor', async () => {
  const failingConnector: IntentSearchConnector = {
    id: 'failing',
    name: 'Conector com Falha',
    async search() {
      throw new Error('Falha de rede simulada');
    },
  };

  const healthyConnector = new MockConnector('healthy', 'Saudável', {
    connectorId: 'healthy',
    connectorName: 'Saudável',
    signals: [
      {
        sourceUrl: 'https://reddit.com/r/salao/123',
        text: 'Tenho uma esmalteria e manicure. Procuro recepcionista virtual para o WhatsApp.',
      },
    ],
  });

  const result = await scanRadarOpportunities({
    connectors: [failingConnector, healthyConnector],
  });

  assert.equal(result.ok, true);
  assert.equal(result.opportunities.length, 1);
  assert.ok(result.sourceLimitations.length >= 1);
  assert.ok(result.sourceLimitations[0].includes('Falha de rede simulada'));
});

test('scanRadarOpportunities calcula metricsBySource, rejectionBreakdown e separa descartados', async () => {
  const connector = new MockConnector('conn1', 'Fonte 1', {
    connectorId: 'conn1',
    connectorName: 'Fonte 1',
    signals: [
      {
        sourceUrl: 'https://site.com/comprador',
        text: 'Sou dono de barbearia e perco clientes porque não dou conta do WhatsApp. Preciso de agendamento.',
      },
      {
        sourceUrl: 'https://site.com/devops',
        text: 'Como subir Docker e n8n em VPS Linux para webhook do WhatsApp?',
      },
      {
        sourceUrl: 'https://site.com/curioso',
        text: 'Qual sistema de agendamento no WhatsApp é bom?',
      },
    ],
  });

  const result = await scanRadarOpportunities({ connectors: [connector] });

  assert.equal(result.totalSignalsCollected, 3);
  assert.equal(result.opportunities.length, 2); // 1 HIGH/MEDIUM e 1 LOW
  assert.equal(result.discardedCount, 1);
  assert.equal(result.discardedAudit.length, 1);
  assert.equal(result.discardedAudit[0].rejectionCategory, 'TECH_OR_DEVOPS');

  // metricsBySource
  const src = result.metricsBySource['conn1'];
  assert.ok(src);
  assert.equal(src.collected, 3);
  assert.equal(src.qualified, 1);
  assert.equal(src.discarded, 1);
  assert.equal(src.rejectionReasons['TECH_OR_DEVOPS'], 1);

  // rejectionBreakdown
  assert.equal(result.rejectionBreakdown['TECH_OR_DEVOPS'], 1);
});

