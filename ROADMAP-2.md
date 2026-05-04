## ✅ Fase 0 — (já concluída)

Base de comparação integrada

Status:

- priceHistory existente
- comparador integrado no item
- suporte a empate
- lojas padrão + personalizadas

---

## ✅ Fase 1 — (já concluída)

Validação e consistência

Status:

- bloqueio de duplicados por nome
- normalização de nome aplicada
- sincronização com priceHistory no updateItem

---

## ✅ Fase 2 — (já concluída)

Refinamento da base — modelo de preços desacoplado da lista

Status:

- `ProductPrice` type criado (`productKey`, `productName`, `storeId`, `price`, `updatedAt`)
- `productPrices: ProductPrice[]` adicionado ao store (upsert por `productKey + storeId`)
- `addItem` / `updateItem` fazem upsert em `productPrices` automaticamente
- mudança de nome propaga renomeação em `productPrices` e `priceHistory` atomicamente
- `deleteStore` limpa entradas de `productPrices` da loja removida
- `getProductBestPrice(productKey)` retorna o `ProductPrice` mais barato ou `null`
- `importData` aceita `productPrices` opcional
- store bumped para `version: 5` com migração `fromVersion < 5` (inicializa array vazio)
- `priceHistory` mantido como log histórico (não alterado)

---

## ✅ Fase 3 — (já concluída)

Alertas inteligentes de preço

Status:

- fonte trocada: `priceHistory` → `productPrices` (lookup O(n) sobre tabela pequena, sem sort/dedup)
- 3 estados distintos: `'best'` / `'tie'` / `'above'`
- badge verde "Melhor preço" — único mais barato
- badge outline "Empate" — empatado com outra loja
- badge âmbar "↓ Loja · -R$ X,XX" — mais caro, mostra onde economizar e quanto
- prop `savings` (centavos) passada ao `item-card` e exibida via `formatCurrency`
- UI não poluída: badge só aparece quando há pelo menos 2 lojas com preço registrado

---

## ✅ Fase 4 — (já concluída)

Sugestão ao adicionar item

Status:

- `SuggestionHint` criado em `suggestion-hint.tsx` (componente leve, reutilizável)
- `suggestion` useMemo: filtra `productPrices` por `productKey` exato (≥ 2 chars), calcula `minPrice` e `avgPrice`
- `applySuggestion()`: preenche `price` e `storeId` com um clique em "Usar →"
- preço médio exibido somente quando diferente do mínimo (evita redundância)
- sugestão aparece apenas quando `price` ainda não foi preenchido (não compete com `PriceAlertBanner`)
- desktop: sugestão abaixo do grid de campos
- mobile: sugestão imediatamente abaixo do campo Nome
- sem bloqueio de input, sem poluição visual

---

## ✅ Fase 5 — (já concluída)

Atualização global de preços

Status:

- `updateProductPrice(productKey, storeId, priceCents)` adicionado ao store
  - atualiza entrada existente em `productPrices` sem mudar nenhum item
  - no-op se a entrada não existir (apenas update, não insert)
  - propaga para todas as listas via reatividade do Zustand
- seletor scoped em `list-detail-client.tsx`: assina apenas os `productPrices`
  cujos `productKey` estão presentes na lista atual (evita re-render em updates de
  produtos de outras listas)
- `priceStatusMap` recalcula automaticamente ao receber novo `productPrices`
- nenhum dado de item é mutado — apenas os badges são sinalizados
- suporte a empate (`'tie'`), melhor preço (`'best'`) e acima (`'above'`) mantidos

---

## ✅ Fase 6 — (já concluída)

Visão de comparação — `/dashboard/precos`

Status:

- rota `/dashboard/precos` criada (page + `PricesClient`)
- `PricesClient` lê `productPrices` via `useShallow` — reativo a qualquer update global
- produtos agrupados por `productKey`, ordenados A-Z; lojas ordenadas pelo preço (menor → maior)
- destaque visual por estado:
  - preço mais barato único: verde + badge `↓`
  - empate: verde + badge `=`
  - acima do melhor: âmbar (sem badge extra)
- `updatedAt` exibido por linha (`dd/MM`)
- edição de preço via dialog leve (`updateProductPrice`)
- adição de nova loja para produto via dialog com Select + CurrencyInput (`addProductPrice`)
  - Select filtra somente lojas sem preço cadastrado para aquele produto
  - retorna `false` se já existir par (`productKey × storeId`) — toast de erro
- remoção via `ConfirmDialog` (`removeProductPrice`)
- busca por nome de produto
- responsivo: 1 col (mobile) / 2 cols (sm) / 3 cols (lg)
- ações de editar/remover visíveis sempre no mobile, no hover no desktop
- `addProductPrice` e `removeProductPrice` adicionados ao store
- nav item "Comparador" (`TrendingDown`) adicionado ao Sidebar

---

## Fase 7 — Agrupamento por loja

Regras:

- agrupar itens por melhor loja
- não alterar lista original

Aplicar em:

- nova view

Entregáveis:

- visão “onde comprar”

---

## Fase 8 — Notificações globais

Regras:

- ao abrir app:
  - detectar itens mais baratos

- mostrar resumo

Aplicar em:

- dashboard

Entregáveis:

- alerta global

---

## Fase 9 — Insights de preço

Regras:

- calcular:
  - média
  - menor histórico
  - tendência simples

Aplicar em:

- estatísticas

Entregáveis:

- inteligência de preço

---

## Nova ordem recomendada

2 → 5 → 3 → 4 → 6 → 7 → 8 → 9

---
