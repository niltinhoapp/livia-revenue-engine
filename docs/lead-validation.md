# Lead Data Validation Contract

## Objetivo

Separar **qualidade dos dados** de **potencial comercial**. Um lead pode ser comercialmente interessante e ainda assim não estar pronto para contato.

## Estados do telefone

- `MISSING` — nenhum telefone oficial do estabelecimento foi encontrado.
- `NEEDS_REVIEW` — o scraper encontrou um telefone no campo oficial da empresa, mas ainda não existe confirmação independente de que o número pertence ao estabelecimento.
- `VERIFIED` — o telefone foi confirmado por revisão humana ou por uma validação futura de fonte independente.
- `REJECTED` — o telefone foi considerado incorreto e não pode ser usado para contato.

`phone` e `phoneUnformatted` são tratados como dados de telefone do próprio place retornados pela fonte de coleta. Isso não deve ser interpretado como prova definitiva de propriedade do número.

## Regra de contato

Somente `VERIFIED` pode liberar a ação de contato via WhatsApp.

`MISSING`, `NEEDS_REVIEW` e `REJECTED` não devem liberar contato automático.

## Score de qualidade dos dados

`dataQualityScore` mede **completude/qualidade estrutural dos dados encontrados**, não chance de compra.

Critérios atuais:

- nome: 15
- segmento: 15
- cidade: 10
- endereço: 15
- telefone: 20
- site: 10
- Google Maps: 10
- avaliação/reviews: 5

Total máximo: 100.

## Qualificação comercial

`score` continua sendo um índice de prioridade comercial. Ele não substitui a validação dos dados.

A ordem correta é:

```text
DADOS ENCONTRADOS
      ↓
QUALIDADE DOS DADOS
      ↓
VALIDAÇÃO DO TELEFONE
      ↓
QUALIFICAÇÃO COMERCIAL
      ↓
ABORDAGEM
```

## Evolução futura

A validação poderá cruzar fontes independentes, como site oficial ou outra fonte comercial confiável. Quando isso existir, a confirmação poderá ser automatizada com evidência registrada.
