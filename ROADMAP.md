# ListaFácil — Roadmap de Melhorias

Backlog estruturado com bugs, melhorias técnicas, UX e novas funcionalidades identificados na análise do projeto. Organizado por prioridade de impacto vs. esforço.

> Contexto: projeto frontend-only (Next.js + Zustand + localStorage). Nenhum item aqui envolve backend, banco de dados ou autenticação.

---

## Alta Prioridade

Itens com bugs reais afetando o uso, ou melhorias de alto impacto com esforço baixo.

---

### ✅ 1. Fix: link ativo na sidebar não destaca subpáginas

**Arquivo:** `src/components/sidebar.tsx:53`

**Problema:** O destaque de navegação usa `pathname === href` (match exato). Ao acessar `/dashboard/listas/123`, o item "Minhas Listas" na sidebar não fica destacado.

**Implementação:** Trocar para `pathname.startsWith(href)` nos itens de subnível. Manter match exato apenas para `/dashboard` (página inicial), para evitar que ela fique sempre ativa.

---

### ✅ 2. Fix: contagem incorreta no "ver mais" do histórico

**Arquivo:** `src/app/dashboard/historico/page.tsx:79`

**Problema:** A lista renderizada filtra por `isPurchased` antes do `slice(0, 6)`, mas o `+N itens` usa `h.itemsSummary.length` (total sem filtro). Se houver itens não comprados no sumário, o número exibido está errado.

**Implementação:** Calcular o `+N` com base nos itens filtrados:
```ts
const purchased = h.itemsSummary.filter(i => i.isPurchased)
purchased.slice(0, 6).map(...)
{purchased.length > 6 && <span>+{purchased.length - 6} itens</span>}
```

---

### ✅ 3. Fix: botão excluir categoria inacessível no mobile

**Arquivo:** `src/app/dashboard/categorias/categories-client.tsx:189`

**Problema:** O botão de excluir em categorias personalizadas usa `opacity-0 group-hover:opacity-100`, igual ao padrão anterior corrigido nos itens de lista. Em mobile não há hover, tornando a exclusão impossível.

**Implementação:** Aplicar o mesmo padrão já usado nos itens:
```
opacity-100 md:opacity-0 md:group-hover:opacity-100
h-10 w-10 md:h-auto md:w-auto md:p-1
aria-label="Excluir categoria"
```

---

### ✅ 4. Fix: deleteCategory não limpa referências nos itens

**Arquivo:** `src/store/use-app-store.ts` — action `deleteCategory`

**Problema:** Ao excluir uma categoria personalizada, os itens que a referenciam ficam com `categoryId` apontando para um ID inexistente. Isso causa comportamentos silenciosos: filtros não funcionam, categoria não aparece no card do item.

**Implementação:** Expandir a action para também limpar a referência nos itens:
```ts
deleteCategory: (id) => {
  set((s) => ({
    categories: s.categories.filter((c) => c.id !== id || c.isDefault),
    items: s.items.map((i) =>
      i.categoryId === id ? { ...i, categoryId: undefined } : i
    ),
  }))
},
```

---

### ✅ 5. Feedback visual após ações (toast)

**Problema:** Adicionar item, marcar como comprado, concluir lista, excluir — nenhuma ação tem confirmação visual. O usuário precisa observar a mudança de estado para saber que funcionou. Em mobile com scroll isso é especialmente confuso.

**Implementação:** Adicionar um componente de toast simples (já existe `src/components/ui/toast.tsx` no projeto). Disparar toasts em:
- Item adicionado / editado / excluído
- Lista concluída ("Lista salva no histórico!")
- Lista excluída

---

### ✅ 6. UI para editar lista (nome, descrição, orçamento)

**Problema:** A action `updateList` existe no store mas não há nenhum botão de edição exposto na interface. O usuário não consegue corrigir o nome de uma lista, ajustar o orçamento ou atualizar a descrição após a criação.

**Implementação:** Adicionar um botão de edição (ícone `Pencil`) no header de `list-detail-client.tsx`, abrindo um dialog com os três campos (nome, descrição, orçamento via `CurrencyInput`). Padrão idêntico ao dialog de edição de item já implementado.

---

### ✅ 7. Exportar e importar dados (backup JSON)

**Problema:** Sendo localStorage-only, não há sincronização entre dispositivos nem backup automático. Trocar de navegador ou limpar dados do browser perde tudo permanentemente.

**Implementação:**
- **Exportar:** serializar `{ lists, items, categories, history }` do store → `JSON.stringify` → download de arquivo `.json` via `URL.createObjectURL`.
- **Importar:** input `type="file"` aceita `.json` → parse → confirmar merge ou substituição → `set(parsedState)`.
- Adicionar na página de Categorias ou em uma nova página "Configurações".

---

## Média Prioridade

Melhorias relevantes que aumentam a qualidade do app sem serem bloqueantes.

---

### ✅ 8. Substituir `confirm()` nativo por AlertDialog

**Arquivos:** `lists-client.tsx`, `list-detail-client.tsx`, `categories-client.tsx`

**Problema:** O `window.confirm()` exibe um diálogo nativo do browser — visual inconsistente, bloqueante, sem customização e especialmente ruim em mobile.

**Implementação:** Usar `AlertDialog` do Radix UI (mesma biblioteca já usada no projeto). Padrão: "Tem certeza?" com botões "Cancelar" e "Excluir". Pode ser um componente reutilizável `<ConfirmDialog>`.

---

### ✅ 9. Duplicar lista

**Problema:** Listas recorrentes (mercado semanal, lista mensal) precisam ser recriadas manualmente toda vez — incluindo todos os itens.

**Implementação:**
- Adicionar action `duplicateList(id)` no store: copia a lista com novo ID, mesmo nome + " (cópia)", mesmo orçamento/descrição, e duplica todos os itens com `isPurchased: false`.
- Expor como botão no card da lista (ao lado do excluir) e/ou no header do detalhe da lista.

---

### ✅ 10. Modo de compras

**Problema:** A tela de detalhe tem filtros, formulário de adição, barra de orçamento e outras informações — muito conteúdo para usar com o celular na mão dentro do supermercado.

**Implementação:** Um toggle "Modo compras" no header que:
- Oculta o formulário de adição, filtros e barra de orçamento
- Aumenta o tamanho do checkbox e do nome do item
- Mantém apenas a marcação de comprado e o nome/quantidade visíveis
- Persiste no estado local do componente (não precisa ir ao store)

---

### 11. Botão "Concluir lista" com validação

**Problema:** É possível concluir uma lista com 0 itens comprados, sem nenhum aviso. Isso gera histórico com `totalActual: 0` e pode ser um erro acidental.

**Implementação:** Antes de chamar `completeList`, verificar se `purchased === 0` e exibir um AlertDialog de confirmação extra: "Nenhum item foi marcado como comprado. Deseja concluir mesmo assim?".

---

### 12. Badge de contagem na sidebar

**Problema:** Não há indicação visual de quantas listas ativas existem sem entrar na tela "Minhas Listas".

**Implementação:** Adicionar um badge numérico ao lado de "Minhas Listas" na sidebar, calculado com `lists.filter(l => !l.isCompleted).length`. Usar o componente `<Badge>` já existente. Ocultar quando for 0.

---

### 13. Adicionar item diretamente das sugestões

**Problema:** A página de Estatísticas mostra os itens mais comprados como "Sugestões inteligentes", mas são apenas tags visuais sem ação. O usuário precisa ir manualmente para uma lista e digitar o nome de novo.

**Implementação:** Adicionar um botão `+` em cada sugestão que abre um popover/dialog para selecionar a lista destino e adicionar o item diretamente. Aproveita o `addItem` do store com os dados do histórico (nome, categoria).

---

### 14. Histórico expandível com detalhe completo

**Problema:** Cada entrada do histórico mostra no máximo 6 itens comprados. Não há como ver o detalhamento completo de uma compra passada — quantidades, preços reais, itens não comprados.

**Implementação:** Tornar o card do histórico clicável/expansível. Ao expandir, mostrar a lista completa separada em duas seções: "Comprados" e "Não comprados", com quantidade e preço real de cada item.

---

### 15. Filtro de período nas estatísticas

**Problema:** A página de Estatísticas agrega todos os dados desde sempre, sem possibilidade de filtrar por período. Com o tempo, dados antigos distorcem as métricas atuais.

**Implementação:** Adicionar um select com opções: "Último mês", "Últimos 3 meses", "Últimos 6 meses", "Este ano", "Tudo". Filtrar o array `history` antes de fazer os cálculos. Estado local no componente, não precisa persistir.

---

### 16. Fix: FAB mobile sobrepõe conteúdo

**Arquivo:** `src/app/dashboard/listas/[id]/list-detail-client.tsx`

**Problema:** O botão flutuante `+` fixo em `bottom-6 right-6` fica sobre o último item da lista e sobre o rodapé da página em telas pequenas. O `pb-20` no container só ameniza parcialmente.

**Implementação:** Garantir `pb-24` no container da lista de itens. Considerar mover o FAB para dentro do fluxo no final da página em vez de `position: fixed`, usando `sticky` apenas quando há scroll suficiente.

---

## Baixa Prioridade / Nice-to-have

Melhorias incrementais ou opcionais que agregam valor sem urgência.

---

### 17. Templates de lista

**Descrição:** Listas pré-configuradas com itens comuns para casos de uso frequentes (ex: "Mercado básico", "Churrasco", "Faxina doméstica", "Festa").

**Implementação:** Criar `src/lib/templates.ts` com um array de templates (`{ name, description, items[] }`). Adicionar um select "Usar template" no dialog de criação de lista que pré-popula os campos e já chama `addItem` para cada item do template.

---

### 18. PWA — app instalável

**Descrição:** O app já funciona offline (tudo é localStorage), falta apenas ser instalável na tela inicial do celular como um app nativo.

**Implementação:** Adicionar `manifest.json` em `/public` com nome, ícones e `display: "standalone"`. Next.js serve automaticamente. Sem service worker necessário (localStorage não precisa de cache offline).

---

### 19. Compartilhar lista como texto

**Descrição:** Gerar uma versão em texto da lista para enviar por WhatsApp ou outro mensageiro ("Mercado - 12/05\n✓ Arroz 2kg - R$ 8,00\n□ Feijão 1kg...").

**Implementação:** Botão "Compartilhar" no header do detalhe da lista que monta a string formatada e chama `navigator.share()` (Web Share API) com fallback para copiar para a área de transferência.

---

### 20. Ordenação manual de itens (drag & drop)

**Descrição:** Permitir reordenar itens dentro de uma lista arrastando, útil para organizar por seção do supermercado.

**Implementação:** Biblioteca `@dnd-kit/sortable` (leve, acessível, sem dependências pesadas). Adicionar campo `order: number` no tipo `Item` e na action `updateItem`. Persistir a nova ordem no store após soltar o drag.

---

### 21. Busca global

**Descrição:** Campo de busca que filtra itens em todas as listas ativas simultaneamente, sem precisar entrar em cada lista.

**Implementação:** Nova rota `/dashboard/busca` ou modal de busca global acionado por atalho. Retorna itens agrupados por lista com link direto para cada um.

---

## Refatorações técnicas

Melhorias internas sem impacto visual direto, mas que facilitam manutenção e reduzem risco de bugs futuros.

---

### T1. Fatiamento de `list-detail-client.tsx`

O arquivo tem 718 linhas com 4 responsabilidades distintas. Extrair:
- `<BudgetCard list={list} items={listItems} />`
- `<ItemCard item={item} onEdit onDelete onToggle />`
- `<EditItemDialog item={editingItem} onSave onClose />`
- `<AddItemForm listId onAdd />`

---

### T2. Funções utilitárias para cálculos duplicados

O cálculo `items.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0)` aparece em 3 arquivos diferentes. Centralizar em `src/lib/utils.ts`:
```ts
export function calcEstimated(items: Item[]): number
export function calcActual(items: Pick<Item, 'actualPrice' | 'estimatedPrice' | 'quantity' | 'isPurchased'>[]): number
```

---

### T3. Hook `useStatistics()`

Toda a lógica de computação de `estatisticas/page.tsx` (loops, maps, agregações) deveria estar em `src/hooks/use-statistics.ts`, deixando o componente responsável apenas por renderizar os dados prontos.

---

### T4. Seletores de store com `useShallow`

Seletores que retornam arrays derivados (`.filter(...)`, `.map(...)`) criam nova referência a cada render, causando re-renders desnecessários. Usar `useShallow` do Zustand:
```ts
import { useShallow } from 'zustand/react/shallow'
const listItems = useAppStore(useShallow(s => s.items.filter(i => i.listId === listId)))
```

---

### T5. Skeleton no lugar do `return null` do `useMounted`

O guard `if (!mounted) return null` exibe tela em branco durante a hidratação. Retornar um skeleton com as dimensões aproximadas da página elimina o flash de conteúdo sem comprometer o guard de SSR.

---

*Última atualização: 2026-05-02*
