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

## 4. Oferta comercial inicial

> **Uma recepcionista virtual que atende seus clientes no WhatsApp enquanto você trabalha.**

A comunicação deve vender o resultado e a experiência, não apenas IA.

## 5. Princípios da operação

### Receita primeiro

Toda evolução deve buscar aumentar aquisição, conversão ou eficiência comercial real.

### Dados antes da abordagem

Uma empresa encontrada não deve ser considerada automaticamente um lead pronto para contato. Primeiro validamos os dados; depois avaliamos o potencial comercial; só então liberamos a abordagem.

### Resposta antes de insistência

A ausência de resposta não deve gerar uma sequência automática de mensagens. A automação comercial deve se apoiar principalmente em sinais reais de resposta e interesse.

### IA com controle humano

A IA pode conduzir o lead automaticamente até o limite configurado. O operador deve poder assumir a conversa a qualquer momento. Quando o humano assume, a IA não deve interferir até que o atendimento seja devolvido a ela.

### Independência da Livia

O Revenue Engine deve evoluir sem exigir alterações na Livia ou na configuração da Meta enquanto essas alterações não forem necessárias. Se a Livia falhar, o operador precisa conseguir continuar manualmente.

## 6. Arquitetura comercial aprovada

```text
GOOGLE MAPS / APIFY
        ↓
INGESTÃO
        ↓
NORMALIZAÇÃO
        ↓
DEDUPLICAÇÃO
        ↓
VALIDAÇÃO DOS DADOS
        ↓
QUALIFICAÇÃO COMERCIAL
        ↓
IA ANALISA O CONTEXTO
        ↓
IA PREPARA ABORDAGEM
        ↓
CONTATO PERMITIDO
        ↓
┌─────────────────────┐
│ NÃO RESPONDEU       │ → NÃO INSISTIR AUTOMATICAMENTE
└─────────────────────┘
        ↓
RESPONDEU
        ↓
IA CONDUZ ATÉ LIMITE CONFIGURADO
        ↓
INTERESSE / SITUAÇÃO ESPECIAL
        ↓
HANDOFF
        ↓
HUMANO
        ↓
VENDA
```

## 7. Validação dos dados

A validação deve ser separada do score comercial.

### 7.1 Qualidade do dado

Verificar, quando disponível:

- nome da empresa;
- segmento;
- cidade;
- endereço;
- telefone da própria empresa;
- site;
- link do Google Maps;
- avaliações;
- presença digital;
- consistência entre fontes.

### 7.2 Telefone

A existência de um telefone não prova que ele pertence à empresa.

O sistema deve evoluir para registrar confiança do telefone, por exemplo:

```text
CONFIRMADO
PRECISA_REVISÃO
INCONSISTENTE
AUSENTE
```

Telefone inconsistente ou não confiável não deve liberar automaticamente a ação de WhatsApp.

O sistema nunca deve substituir o telefone oficial da empresa por um telefone de contato/enriquecimento sem evidência suficiente.

### 7.3 Revisão manual

Quando houver dúvida, o lead deve continuar disponível para revisão humana, com o link da fonte preservado.

## 8. Qualificação comercial

O score é um **índice de prioridade**, não uma porcentagem de chance de venda.

A qualificação deve considerar sinais observáveis, como:

- pertencimento ao ICP;
- canal de atendimento disponível;
- presença digital;
- sinais de volume de atendimento;
- avaliações e reputação;
- necessidade provável de atendimento/agendamento/orçamento;
- capacidade da Livia de resolver ou demonstrar o problema.

A regra de aprovação pode evoluir conforme dados reais forem coletados.

## 9. IA de abordagem

A IA deve receber somente contexto confiável e criar uma abordagem curta, humana e personalizada.

### Regras

- usar dados reais;
- não inventar fatos;
- não prometer resultados não comprovados;
- não usar falsa urgência;
- não pressionar;
- não repetir automaticamente a abordagem diante do silêncio;
- adaptar o texto ao segmento e contexto;
- registrar a versão utilizada para medir conversão.

### Modelo

Para geração de abordagem e raciocínio comercial, priorizar modelo de alta capacidade da OpenAI. Modelos menores podem ser utilizados em tarefas simples e de alto volume quando isso não comprometer qualidade ou conversão.

## 10. Conversação orientada por resposta

O comportamento desejado é:

```text
PRIMEIRO CONTATO
      ↓
SEM RESPOSTA → PARAR
      ↓
RESPONDEU
      ↓
IA INTERPRETA
      ↓
IA RESPONDE
      ↓
INTERESSE?
   ↙       ↘
 NÃO       SIM
 ↓          ↓
CONTINUA   DEMONSTRAÇÃO / PRÓXIMA AÇÃO
CONTEXTO             ↓
                  HUMANO
```

Não criar cadências agressivas de follow-up sem resposta.

## 11. Controle IA ↔ Humano

Estados operacionais:

```text
IA_ATIVA
AGUARDANDO_HUMANO
HUMANO_ATIVO
DEVOLVIDO_PARA_IA
ENCERRADO
OPT_OUT
```

### IA_ATIVA

A IA pode responder e conduzir o lead dentro das regras definidas.

### AGUARDANDO_HUMANO

A conversa possui intenção comercial, objeção, solicitação especial ou situação que exige intervenção.

### HUMANO_ATIVO

O operador assumiu. A IA não envia nem interfere na conversa.

### DEVOLVIDO_PARA_IA

O operador libera novamente a automação.

### ENCERRADO

A conversa não possui próxima ação comercial.

### OPT_OUT

O contato não deve receber novas abordagens automatizadas.

## 12. Handoff

Quando houver intenção comercial suficiente, a IA deve entregar ao humano um resumo mínimo:

- empresa;
- nome do contato, quando disponível;
- necessidade;
- contexto da conversa;
- interesse identificado;
- objeções;
- próxima ação sugerida.

Se a Livia estiver indisponível ou falhar, o operador deve conseguir assumir manualmente usando o histórico existente.

## 13. Funil oficial

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

As transições são controladas por código.

## 14. Estratégia

### Inbound

A Livia atende contatos que chegam à ConnectWeb, entende a necessidade e encaminha oportunidades reais.

### Outbound

O Revenue Engine encontra empresas, valida dados, qualifica potenciais compradores, prepara abordagens personalizadas e conduz **somente os contatos permitidos e que respondem** para a próxima etapa.

A operação deve respeitar LGPD, regras do canal, base legal/consentimento aplicável e OPT-OUT.

## 15. Fases de execução

### Fase 0 — Base

- documentação;
- escopo;
- estados do CRM;
- métricas;
- ICP;
- oferta;
- roteiro de demonstração.

### Fase 1 — Qualidade dos dados

- validar telefone da própria empresa;
- detectar inconsistências;
- registrar confiança;
- bloquear contato quando necessário;
- preservar fontes para revisão.

### Fase 2 — IA de abordagem

- analisar contexto;
- escolher ângulo comercial;
- gerar abordagem personalizada;
- registrar versão;
- medir resposta por abordagem e segmento.

### Fase 3 — Conversação

- processar respostas;
- permitir condução automática até limite configurado;
- detectar interesse e objeções;
- acionar handoff;
- permitir assumir e devolver a conversa.

### Fase 4 — Validação comercial

Começar com aproximadamente 100 empresas.

Medir:

- dados válidos;
- telefones confiáveis;
- contatos realizados;
- respostas;
- interessados;
- demonstrações;
- propostas;
- vendas;
- receita;
- objeções;
- conversão por segmento;
- conversão por abordagem;
- conversão por etapa da IA.

### Fase 5 — Escala

Somente após validação:

- 500 empresas/mês;
- depois 1.000 empresas/mês;
- automatizar tarefas repetitivas comprovadamente úteis;
- otimizar os pontos de maior perda.

## 16. Definition of Done — Fase Receita

A fase está pronta quando:

- empresas podem ser encontradas e normalizadas;
- dados críticos podem ser validados;
- leads podem ser qualificados;
- abordagens podem ser geradas com IA;
- não há disparo indiscriminado;
- respostas podem alimentar a conversa;
- a IA pode conduzir dentro de limites configuráveis;
- o humano pode assumir a qualquer momento;
- o humano pode continuar mesmo se a Livia falhar;
- interessados são encaminhados corretamente;
- propostas e vendas podem ser registradas;
- métricas reais permitem decidir o próximo investimento;
- existe pelo menos um fluxo real de aquisição sendo executado;
- existe pelo menos um cliente pagante real ou dados suficientes para uma decisão clara de ajuste.

## 17. Backlog futuro

Somente depois da validação comercial:

- scoring avançado;
- validação externa automatizada de telefones;
- novos canais;
- novos segmentos;
- analytics avançado;
- automações adicionais;
- CRM avançado;
- memória comercial avançada;
- experimentos de conversão.

**Backlog não é escopo atual.**

## 18. Regra definitiva

> **Primeiro vender. Depois melhorar com base em dados reais.**
