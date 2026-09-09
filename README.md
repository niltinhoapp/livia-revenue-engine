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

## Fluxo

```text
Google Maps → Apify → Normalização → Deduplicação → Score
→ IA/personalização → Fila de prospecção → Contato permitido
→ Resposta → Interessado → Livia → Qualificação → Humano → Venda
```

## Estado atual da implementação

O motor já possui:

- coleta via `compass/crawler-google-places`;
- buscas dos 3 segmentos por cidade;
- normalização de nome, telefone, site, endereço, avaliações e localização;
- deduplicação;
- classificação do ICP;
- score de 0–100;
- persistência JSON/CSV;
- personalização via OpenAI Responses API;
- fila de revisão de prospecção sem disparo automático;
- proteção de OPT-OUT;
- transições controladas do funil comercial;
- testes automatizados para fila e funil.

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

O `APIFY_TOKEN` deve existir somente no ambiente seguro de execução. Nunca publique o token no GitHub.

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

## Regra de contato

Este projeto **não dispara WhatsApp automaticamente** a partir de números encontrados no Google Maps. Descoberta de empresas, qualificação e preparação de abordagem são separadas do contato.

Qualquer contato deve usar canal e processo compatíveis com LGPD, base legal/consentimento aplicável, regras do canal e OPT-OUT.

## Próximo passo operacional

Depois que o ambiente estiver configurado na Vercel:

1. executar a primeira coleta de 100 empresas;
2. revisar a qualidade dos dados;
3. personalizar os leads qualificados;
4. revisar as abordagens;
5. definir o fluxo de contato permitido;
6. registrar respostas;
7. conectar **somente os interessados** à Livia;
8. medir demonstrações, propostas e vendas.

## Princípio

```text
Construir → Colocar para rodar → Medir → Vender → Aprender → Melhorar
```

**Prioridade absoluta: primeiro cliente pagante.**
