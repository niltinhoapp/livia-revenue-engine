# Livia Revenue Engine

> Máquina interna de aquisição de clientes da ConnectWeb usando a Livia como recepcionista comercial e ponto de demonstração.

## Objetivo

Gerar receita para a ConnectWeb antes de expandir o produto.

A Livia será usada primeiro na própria ConnectWeb para receber, entender, qualificar e encaminhar potenciais clientes. Em paralelo, uma operação enxuta de prospecção encontra empresas com potencial, qualifica os leads e conduz os interessados até uma demonstração e venda.

## Regra principal

**Receita primeiro. Funcionalidades depois.**

Qualquer nova funcionalidade deve ser avaliada pela pergunta:

> Isso aumenta nossa capacidade de conseguir ou fechar clientes da Livia agora?

Se não aumentar, fica fora da Fase Receita.

## Fluxo comercial

```text
Google Maps
    ↓
Apify
    ↓
Lista de empresas
    ↓
Filtro e qualificação
    ↓
IA / personalização
    ↓
Contato permitido
    ↓
Interessado
    ↓
Livia
    ↓
Qualificação comercial
    ↓
Demonstração
    ↓
Nilton / humano
    ↓
Proposta
    ↓
Fechamento
    ↓
Cliente Livia
```

## Livia na ConnectWeb

A própria ConnectWeb será o primeiro ambiente real da Livia.

Responsabilidades da Livia:

- receber o primeiro contato;
- identificar quem está falando;
- entender o motivo do contato;
- responder dúvidas básicas sobre a ConnectWeb e a Livia;
- explicar a solução quando fizer sentido;
- coletar informações comerciais essenciais;
- identificar intenção de compra;
- encaminhar leads qualificados para atendimento humano.

## Prospecção

A primeira meta operacional é trabalhar com até **1.000 empresas/mês**, mas a implantação será gradual:

1. 100 empresas para validar;
2. 500 empresas para otimizar;
3. 1.000 empresas para escalar.

O foco inicial será em segmentos onde atendimento, agendamento, orçamento ou triagem via WhatsApp tenham valor claro.

## Qualificação

Cada empresa deve receber um score comercial baseado em sinais como:

- segmento;
- presença de WhatsApp;
- site;
- presença digital;
- volume aparente de atendimento;
- adequação ao problema que a Livia resolve.

O objetivo não é coletar o maior número possível de empresas. É encontrar as empresas com maior potencial.

## CRM mínimo

Estados oficiais da Fase Receita:

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

## Métricas

O projeto será avaliado pelo funil comercial:

- empresas encontradas;
- empresas qualificadas;
- contatos realizados;
- respostas;
- interessados;
- demonstrações;
- propostas;
- clientes ganhos;
- receita gerada;
- custo de aquisição.

A métrica final é **receita**, não quantidade de automações.

## Escopo da Fase Receita

### Incluído

- prospecção de empresas;
- coleta e organização de leads;
- qualificação;
- geração de abordagem com IA;
- controle de status;
- entrada de leads interessados na Livia;
- recepção comercial da ConnectWeb;
- qualificação comercial;
- encaminhamento para humano;
- acompanhamento básico do funil;
- métricas de conversão.

### Fora do escopo por enquanto

- dashboard avançado;
- múltiplos agentes complexos;
- novas integrações sem necessidade comercial;
- aplicativo mobile novo;
- recursos de CRM não essenciais;
- automações que não contribuam diretamente para aquisição ou fechamento;
- expansão prematura para dezenas de segmentos;
- funcionalidades experimentais sem impacto mensurável em receita.

## Compliance

A operação deve respeitar as regras aplicáveis de privacidade, LGPD e políticas dos canais utilizados. O projeto não deve ser tratado como uma máquina de disparo indiscriminado.

O controle de **OPT-OUT** é obrigatório. Solicitações de não contato devem impedir novas comunicações comerciais automatizadas.

## Princípio de desenvolvimento

Construir somente o necessário para colocar a operação em produção e medir resultado.

```text
Construir → Colocar para rodar → Medir → Vender → Aprender → Melhorar
```

Não:

```text
Construir → adicionar recurso → adicionar recurso → adicionar recurso → nunca vender
```

## Critério de sucesso da fase

A Fase Receita será considerada validada quando a máquina conseguir gerar clientes pagantes reais para a Livia e os dados do funil permitirem identificar claramente onde melhorar a conversão.

## Status

**FASE: RECEITA — EM IMPLEMENTAÇÃO**

**Prioridade absoluta: primeiros clientes pagantes.**
