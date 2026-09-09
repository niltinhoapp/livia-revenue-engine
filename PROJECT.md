# Project — Livia Revenue Engine

## 1. Missão

Transformar a Livia em uma ferramenta de geração de receita para a ConnectWeb, usando-a primeiro como recepcionista comercial da própria empresa e depois como mecanismo de aquisição e conversão de novos clientes.

## 2. Resultado esperado

O resultado desta fase não é uma plataforma completa de prospecção.

O resultado é:

> **primeiros clientes pagantes da Livia.**

## 3. Estratégia

### Inbound

A Livia atende os contatos que chegam à ConnectWeb, entende a necessidade e encaminha oportunidades reais para o responsável comercial.

### Outbound

Uma operação enxuta encontra empresas, qualifica potenciais compradores, prepara abordagens personalizadas e conduz interessados para um contato adequado com a Livia e/ou atendimento humano.

## 4. Funil oficial

```text
LEAD ENCONTRADO
      ↓
QUALIFICAÇÃO
      ↓
CONTATO
      ↓
RESPOSTA
      ↓
INTERESSE
      ↓
DEMONSTRAÇÃO
      ↓
PROPOSTA
      ↓
NEGOCIAÇÃO
      ↓
GANHO / PERDIDO
```

## 5. Arquitetura inicial

```text
APIFY
  ↓
INGESTÃO DE LEADS
  ↓
QUALIFICAÇÃO
  ↓
BANCO / CRM
  ↓
IA
  ↓
ABORDAGEM
  ↓
CANAL DE CONTATO PERMITIDO
  ↓
LIVIA
  ↓
QUALIFICAÇÃO COMERCIAL
  ↓
HUMANO
  ↓
VENDA
```

A tecnologia exata de cada etapa pode evoluir. A função comercial do fluxo não deve ser alterada sem motivo.

## 6. Fases de execução

### Fase 0 — Base

- documentação;
- definição do escopo;
- definição dos estados do CRM;
- definição das métricas;
- definição do primeiro segmento de prospecção.

### Fase 1 — Livia na ConnectWeb

- colocar a Livia para receber contatos reais;
- configurar contexto comercial da ConnectWeb;
- definir critérios de qualificação;
- criar handoff para humano;
- registrar resultados.

### Fase 2 — Prospecção MVP

- coletar empresas;
- normalizar dados;
- aplicar qualificação;
- gerar abordagem personalizada;
- registrar contatos e respostas;
- conduzir interessados para a Livia/humano.

### Fase 3 — Validação

Começar com aproximadamente 100 empresas.

Medir:

- taxa de resposta;
- taxa de interesse;
- demonstrações;
- propostas;
- vendas.

### Fase 4 — Escala

Somente após validação:

- aumentar para 500 empresas/mês;
- depois 1.000 empresas/mês;
- automatizar tarefas repetitivas comprovadamente úteis;
- otimizar os pontos de maior perda do funil.

## 7. Regras de decisão

### Regra 1

Nenhuma funcionalidade nova entra apenas porque parece interessante.

### Regra 2

Uma funcionalidade entra se:

- aumentar aquisição;
- aumentar conversão;
- reduzir trabalho operacional relevante;
- reduzir custo de aquisição;
- melhorar segurança/compliance necessário à operação.

### Regra 3

Se uma melhoria não tiver impacto comercial demonstrável, fica no backlog.

### Regra 4

Não refatorar partes estáveis da Livia sem necessidade comercial, segurança ou correção de bug.

## 8. Handoff humano

Quando houver intenção comercial suficiente, a Livia deve parar de tentar resolver tudo sozinha e entregar a conversa ao humano.

O handoff deve preservar, no mínimo:

- nome;
- empresa;
- motivo do contato;
- necessidade identificada;
- nível de interesse;
- informações relevantes coletadas.

## 9. Métricas mínimas

```text
Leads encontrados
Leads qualificados
Contatos realizados
Respostas
Interessados
Demonstrações
Propostas
Clientes ganhos
Clientes perdidos
Receita
Custo de aquisição
```

## 10. Definition of Done — Fase Receita

A fase está pronta quando:

- a ConnectWeb recebe atendimento inicial pela Livia;
- leads podem entrar no funil;
- empresas podem ser qualificadas;
- o processo comercial pode ser acompanhado;
- interessados são encaminhados corretamente;
- é possível registrar propostas e vendas;
- as métricas básicas estão disponíveis;
- existe pelo menos um fluxo real de aquisição sendo executado;
- a operação consegue gerar e medir oportunidades comerciais reais.

## 11. Backlog futuro

Somente depois da validação comercial:

- otimizações avançadas de scoring;
- novos canais;
- novos segmentos;
- analytics avançado;
- automações adicionais;
- recursos avançados de CRM;
- melhorias de IA;
- experimentos de conversão.

**Backlog não é escopo atual.**
