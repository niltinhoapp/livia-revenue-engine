# Livia Revenue Engine

> Máquina interna de aquisição de clientes da ConnectWeb usando a Livia como recepcionista comercial e ponto de demonstração.

## Objetivo

Gerar receita para a ConnectWeb antes de expandir o produto.

**Receita primeiro. Funcionalidades depois.**

## ICP inicial

- **Barbearias**
- **Salões de beleza**
- **Manicure / nail designers**

Não ampliar o ICP antes de obter dados reais de conversão.

## Oferta comercial

> **Uma recepcionista virtual que atende seus clientes no WhatsApp enquanto você trabalha.**

A venda deve destacar resultado e experiência, não apenas IA.

## Arquitetura comercial aprovada

O Revenue Engine deve separar três decisões diferentes:

1. **Qualidade do dado** — verificar se nome, segmento, cidade, endereço e telefone pertencem à empresa encontrada.
2. **Potencial comercial** — avaliar sinais de que a empresa tem uma necessidade que a Livia consegue resolver.
3. **Prontidão para contato** — só liberar abordagem quando os dados mínimos estiverem confiáveis, não houver OPT-OUT e o lead estiver apto para o próximo passo.

O score é um **índice de prioridade**, não uma probabilidade de compra.

### Validação de telefone

Telefone encontrado não significa telefone confirmado. O sistema não deve tratar simplesmente a existência de um número como prova de que ele pertence à empresa.

O fluxo deve evoluir para estados de confiança do telefone, permitindo bloquear o WhatsApp quando o número estiver inconsistente ou precisar de revisão.

## Fluxo

```text
Google Maps → Apify → Normalização → Deduplicação
→ Validação dos dados → Qualificação comercial
→ IA analisa o contexto → IA prepara abordagem
→ Contato permitido → Resposta
→ IA conduz → Interesse → Livia / Humano → Venda
```

## IA comercial

A IA deve ser usada para aumentar a qualidade da operação, não para gerar disparo indiscriminado.

### Primeira abordagem

A IA deve analisar somente dados reais do lead e criar uma abordagem curta, humana e personalizada.

Regras:

- não inventar informações;
- não prometer resultados inexistentes;
- não usar pressão ou falsa urgência;
- não repetir mensagens automaticamente quando o lead não responde;
- respeitar OPT-OUT e as regras aplicáveis do canal;
- permitir revisão/controle humano quando o fluxo assim exigir.

Para geração de abordagem e raciocínio comercial, priorizar modelo de alta capacidade da OpenAI. Modelos menores podem ser usados posteriormente em tarefas simples e de alto volume, sem sacrificar a qualidade onde ela afeta conversão.

### Conversa após resposta

A automação deve ser orientada por resposta:

```text
1º contato
   ↓
sem resposta → não insistir automaticamente

respondeu
   ↓
IA entende contexto
   ↓
IA conduz conversa
   ↓
interesse suficiente?
   ├── não → encerra / mantém conforme contexto
   └── sim → demonstração / próxima ação
                         ↓
                       humano
```

A IA pode conduzir o lead automaticamente **até o limite configurado**, mas o operador deve poder assumir a conversa a qualquer momento.

### Controle humano / handoff

Estados operacionais:

- **IA_ATIVA** — Livia conduz a conversa.
- **AGUARDANDO_HUMANO** — existe sinal de interesse ou situação que exige intervenção.
- **HUMANO_ATIVO** — operador assumiu e a IA não deve interferir.
- **DEVOLVIDO_PARA_IA** — operador libera novamente a condução automática.
- **ENCERRADO** — conversa finalizada.
- **OPT_OUT** — contato não deve receber nova abordagem.

Se a Livia falhar, o processo deve permitir continuidade manual sem perder o histórico ou o estágio comercial.

## Regra de contato

Este projeto não deve funcionar como disparador indiscriminado de WhatsApp.

A descoberta de empresas, validação, qualificação e preparação de abordagem são etapas separadas do contato.

Não responder automaticamente ao silêncio do lead com uma sequência infinita de mensagens. A próxima automação comercial deve ser acionada principalmente por **sinais reais de resposta e interesse**.

Qualquer contato deve usar canal e processo compatíveis com LGPD, base legal/consentimento aplicável, regras do canal e OPT-OUT.

## Estado atual da implementação

O motor já possui:

- coleta via `compass/crawler-google-places`;
- buscas direcionadas por segmento e cidade;
- normalização de nome, telefone, site, endereço, avaliações e localização;
- deduplicação;
- classificação do ICP;
- score de prioridade;
- persistência JSON/CSV;
- personalização via OpenAI Responses API;
- fila de revisão de prospecção;
- proteção de OPT-OUT;
- transições controladas do funil comercial;
- testes automatizados para fila e funil.

## Funil

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

As transições são validadas por código para evitar saltos incorretos no processo comercial.

## Execução

```bash
npm install
cp .env.example .env
npm run build
npm test
npm run prospect -- collect --city "Bauru, SP, Brasil" --max 100
npm run prospect -- show
npm run prospect -- personalize
```

O `APIFY_TOKEN` e as chaves de IA devem existir somente no ambiente seguro de execução. Nunca publique credenciais no GitHub.

## Próximas fases aprovadas

### Fase 1 — Qualidade dos dados

- melhorar validação do telefone da própria empresa;
- detectar inconsistências entre empresa, telefone e fonte;
- registrar confiança dos dados;
- bloquear contato quando a confiança for insuficiente;
- preservar link do Google Maps para revisão manual.

### Fase 2 — IA de abordagem

- analisar o contexto real do lead;
- escolher ângulo comercial adequado;
- gerar abordagem personalizada de alta qualidade;
- registrar qual versão foi utilizada;
- medir resposta por abordagem e segmento.

### Fase 3 — Conversação orientada por resposta

- receber respostas;
- permitir que a IA conduza o atendimento até o limite configurado;
- detectar interesse, objeções e intenção;
- acionar handoff quando necessário;
- permitir assumir/devolver a conversa manualmente.

### Fase 4 — Validação comercial

Começar com aproximadamente 100 empresas.

Medir:

- taxa de dados válidos;
- taxa de telefones confiáveis;
- taxa de contato;
- taxa de resposta;
- taxa de interesse;
- demonstrações;
- propostas;
- vendas;
- principais objeções;
- conversão por segmento;
- conversão por abordagem.

### Fase 5 — Escala

Somente após validação:

- 500 empresas/mês;
- depois 1.000 empresas/mês;
- automatizar tarefas repetitivas comprovadamente úteis;
- otimizar os pontos de maior perda do funil.

## Princípio

```text
Construir → Colocar para rodar → Medir → Vender → Aprender → Melhorar
```

**Prioridade absoluta: primeiro cliente pagante.**
