# Prospecção MVP — implementação

## Objetivo

Colocar a primeira máquina de prospecção para rodar com foco em 100 empresas do ICP inicial.

## O que já está implementado

- coleta via Apify Google Places Actor;
- 3 buscas do ICP por cidade: barbearia, salão de beleza e manicure/nail designer;
- normalização de nome, telefone, site, localização, avaliação e avaliações;
- deduplicação por `sourceId`, telefone ou combinação empresa + endereço;
- classificação automática do segmento;
- score determinístico de 0–100;
- estágio comercial inicial;
- persistência local em JSON;
- exportação CSV;
- personalização de abordagem via OpenAI Responses API;
- bloqueio de personalização para OPT-OUT e leads sem critérios mínimos.

## Comandos

```bash
npm install
cp .env.example .env
npm run prospect -- collect --city "Bauru, SP, Brasil" --max 100
npm run prospect -- show
npm run prospect -- personalize
```

Para testar sem Apify:

```bash
npm run prospect -- import --file ./data/raw.json
```

## Qualificação

| Sinal | Pontos |
|---|---:|
| Segmento ICP | 40 |
| Telefone | 25 |
| Site | 10 |
| 20+ avaliações | 10 |
| 100+ avaliações | 5 |
| Nota 4+ | 5 |
| Cidade identificada | 5 |

Lead com 60+ pontos e telefone entra como `QUALIFICADO`.

## Regra de contato

Este MVP **não dispara WhatsApp automaticamente**. A coleta e a personalização são separadas do contato. O próximo estágio deve implementar apenas um fluxo de contato compatível com LGPD, consentimento/base legal aplicável, políticas do canal e OPT-OUT.

## Próximo incremento

Depois de validar a coleta com 100 empresas:

1. revisar qualidade dos dados;
2. revisar score;
3. revisar mensagens com base nas respostas reais;
4. definir o canal de contato permitido;
5. registrar respostas e conversões;
6. conectar interessados à Livia.
