## Fase 0 — Base global (nova)

Implementar preços por produto/loja (desacoplado da lista)

Regras:

- criar estrutura `productPrices` (produto + store + preço)
- normalizar nome (`trim + lowercase`)
- impedir duplicado por `normalizedName + storeId`
- manter preços em centavos
- não depender de lista para existir
- manter `priceHistory` como histórico (opcional/derivado)

Aplicar em:

- types
- store (novo estado + actions)
- nova tela: preços/comparador

Entregáveis:

- base global de preços
- cadastro por produto + loja
- sem duplicação por loja

---

## Fase 1 — Integração com lista

Usar base global ao adicionar item

Regras:

- ao digitar produto:
  - verificar duplicado na lista
  - buscar melhor preço global

- exibir avisos:
  - “já existe na lista”
  - “mais barato em X loja”

- não bloquear fluxo

Aplicar em:

- add-item-form
- validações

Entregáveis:

- alerta de duplicado
- alerta de melhor preço

---

## Fase 2 — Melhor preço (refatorado)

Calcular melhor preço usando base global

Regras:

- usar `productPrices` (não items da lista)
- suportar empate
- ignorar ordem de atualização

Aplicar em:

- helpers/comparador

Entregáveis:

- `getBestPrice(product)` confiável

---

## Fase 3 — UI de comparação

Tela dedicada de preços

Regras:

- listar produto → lojas → preços
- destacar menor preço
- mostrar empate
- permitir editar preços

Aplicar em:

- nova tela `/lojas` ou `/precos`

Entregáveis:

- comparador completo
- edição de preços

---

## Fase 4 — Alertas no item

Exibir status no item da lista

Regras:

- melhor preço → badge verde
- mais caro → aviso
- empate → mostrar múltiplas lojas

Aplicar em:

- item-card

Entregáveis:

- badges + alertas

---

## Fase 5 — Atualização global

Impacto ao alterar preço

Regras:

- ao atualizar preço:
  - recalcular melhor preço
  - sinalizar itens impactados

- não alterar item automaticamente

Aplicar em:

- store
- comparador

Entregáveis:

- alerta global funcionando

---

## Fase 6 — Notificação geral

Resumo ao abrir app

Regras:

- detectar itens com preço melhor
- mostrar resumo

Aplicar em:

- dashboard

Entregáveis:

- “X itens mais baratos”

---

## Ordem atualizada

0 → 1 → 2 → 3 → 4 → 5
(depois 6+)

---
