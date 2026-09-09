# Project — Livia Revenue Engine

## 1. Missão

Transformar a Livia em uma ferramenta de geração de receita para a ConnectWeb, usando-a primeiro como recepcionista comercial da própria empresa e depois como mecanismo de aquisição e conversão de novos clientes.

## 2. Resultado esperado

O resultado desta fase não é uma plataforma completa de prospecção.

O resultado é:

> **primeiros clientes pagantes da Livia.**

## 3. ICP inicial — Fase Receita

O primeiro teste comercial fica deliberadamente restrito a três segmentos:

1. **Barbearias**
2. **Salões de beleza**
3. **Manicure / nail designers**

Esses segmentos foram escolhidos porque normalmente possuem atendimento recorrente, dúvidas, pedidos de orçamento e/ou agendamento pelo WhatsApp, tornando a proposta da Livia fácil de demonstrar.

### Regra de foco

Não expandir para novos nichos antes de obter dados suficientes desse primeiro ICP.

A expansão só acontece se houver motivo comercial comprovado ou se os dados mostrarem que outro segmento tem potencial claramente superior.

## 4. Oferta comercial inicial

A comunicação comercial deve vender o resultado, não a tecnologia.

### Posicionamento principal

> **Uma recepcionista virtual que atende seus clientes no WhatsApp enquanto você trabalha.**

A Livia deve ser apresentada como uma solução para reduzir perda de oportunidades, responder clientes e organizar o primeiro atendimento.

### Demonstração

Sempre que possível, o prospect deve experimentar a própria Livia. A demonstração deve mostrar o fluxo real:

```text
CLIENTE
  ↓
LIVIA
  ↓
ENTENDE A NECESSIDADE
  ↓
RESPONDE
  ↓
QUALIFICA
  ↓
ENCAMINHA / EXECUTA A PRÓXIMA AÇÃO
```

A proposta comercial e o preço serão definidos antes do primeiro lote comercial e podem ser ajustados com base nas primeiras objeções e conversões.

## 5. Estratégia

### Inbound

A Livia atende os contatos que chegam à ConnectWeb, entende a necessidade e encaminha oportunidades reais para o responsável comercial.

### Outbound

Uma operação enxuta encontra empresas, qualifica potenciais compradores, prepara abordagens personalizadas e conduz interessados para um contato adequado com a Livia e/ou atendimento humano.

A prospecção deve respeitar LGPD, políticas do canal e requisitos de consentimento aplicáveis. O objetivo não é criar um disparador indiscriminado.

## 6. Funil oficial

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

## 7. Critérios de qualificação do lead

O score inicial deve ser simples e baseado em sinais observáveis:

- pertence ao ICP inicial;
- possui WhatsApp ou canal claro de atendimento;
- possui demanda aparente por atendimento/agendamento/orçamento;
- possui presença digital mínima;
- aparenta ter volume de atendimento suficiente para justificar automação;
- existe um problema que a Livia consegue demonstrar resolver.

Não buscar volume por volume. Priorizar empresas com maior probabilidade de compra.

## 8. Arquitetura inicial

```text
APIFY
  ↓
INGESTÃO DE LEADS
  ↓
NORMALIZAÇÃO / DEDUPLICAÇÃO
  ↓
QUALIFICAÇÃO
  ↓
BANCO / CRM
  ↓
IA / PERSONALIZAÇÃO
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

## 9. Fases de execução

### Fase 0 — Base

- documentação;
- definição do escopo;
- definição dos estados do CRM;
- definição das métricas;
- definição do ICP inicial;
- definição da oferta;
- definição do roteiro de demonstração.

### Fase 1 — Livia na ConnectWeb

- colocar a Livia para receber contatos reais;
- configurar contexto comercial da ConnectWeb;
- definir critérios de qualificação;
- criar handoff para humano;
- registrar resultados.

### Fase 2 — Prospecção MVP

- coletar empresas dos três segmentos iniciais;
- normalizar dados;
- remover duplicados;
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
- vendas;
- principais objeções;
- segmento com melhor conversão.

### Fase 4 — Escala

Somente após validação:

- aumentar para 500 empresas/mês;
- depois 1.000 empresas/mês;
- automatizar tarefas repetitivas comprovadamente úteis;
- otimizar os pontos de maior perda do funil.

## 10. CRM mínimo

Estados oficiais:

```text
NOVO
QUALIFICADO
CONTATADO
RESPONDEU
INTERESSADO
DEMONSTRAÇÃO
PROPOSTA
NEGOCIAÇÃO
GANHO
PERDIDO
OPT-OUT
```

## 11. Handoff humano

Quando houver intenção comercial suficiente, a Livia deve parar de tentar resolver tudo sozinha e entregar a conversa ao humano.

O handoff deve preservar, no mínimo:

- nome;
- empresa;
- motivo do contato;
- necessidade identificada;
- nível de interesse;
- informações relevantes coletadas.

## 12. Métricas mínimas

```text
Empresas encontradas
Empresas qualificadas
Contatos realizados
Respostas
Interessados
Demonstrações
Propostas
Clientes ganhos
Clientes perdidos
Receita
Custo de aquisição
Conversão por segmento
Principais objeções
```

A métrica mais importante da fase é **clientes pagantes e receita gerada**.

## 13. Definition of Done — Fase Receita

A fase está pronta quando:

- a ConnectWeb recebe atendimento inicial pela Livia;
- leads podem entrar no funil;
- empresas podem ser qualificadas;
- o processo comercial pode ser acompanhado;
- interessados são encaminhados corretamente;
- é possível registrar propostas e vendas;
- as métricas básicas estão disponíveis;
- existe pelo menos um fluxo real de aquisição sendo executado;
- existe pelo menos um cliente pagante real ou dados suficientes para uma decisão clara de ajuste;
- a operação consegue gerar e medir oportunidades comerciais reais.

## 14. Backlog futuro

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

## 15. Regra definitiva do projeto

> **Foco em receita. Primeiro vender. Depois melhorar com base nos dados reais.**

Nenhuma funcionalidade entra apenas porque parece interessante. Ela precisa aumentar aquisição, conversão, eficiência operacional, reduzir CAC ou atender uma necessidade real de segurança/compliance.
