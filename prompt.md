Quero simplificar o projeto ListaFácil.

Remova a dependência de banco de dados, PostgreSQL, Prisma e Docker. O projeto deve funcionar 100% no frontend/local, usando apenas `localStorage` como persistência principal.

Também quero usar uma camada de cache no client para evitar leituras repetidas e manter a interface rápida.

## Objetivo

Transformar o app em uma aplicação local-first, sem backend real e sem banco de dados.

## Regras

- Não usar PostgreSQL.
- Não usar Prisma.
- Não usar Docker.
- Não usar autenticação.
- Não criar API Routes dependentes de banco.
- Não usar Server Components para buscar dados.
- Toda persistência deve ser feita no `localStorage`.
- Os dados devem continuar disponíveis após recarregar a página.
- Usar cache em memória no client, preferencialmente com Zustand ou TanStack Query.
- Manter Next.js, TypeScript, Tailwind CSS, Radix UI e next-themes.
- Manter as funcionalidades atuais do app.

## O que adaptar

Substituir o fluxo atual:

```txt
Server Component → Prisma → PostgreSQL
API Routes → Prisma → PostgreSQL

por
Client Components → store/cache → localStorage

Funcionalidades que devem continuar existindo
Criar, editar e excluir listas de compras.
Criar, editar e excluir itens.
Marcar itens como comprados.
Categorias padrão e personalizadas.
Filtros por categoria, status e busca por nome.
Ordenação por prioridade, nome ou categoria.
Controle de orçamento.
Concluir lista e salvar histórico.
Histórico de compras.
Estatísticas.
Dark mode.
Layout responsivo.
Entregáveis
Remover Prisma, PostgreSQL e Docker do projeto.
Criar uma camada de storage usando localStorage.
Criar tipos TypeScript para List, Item, Category, PurchaseHistory e Priority.
Criar um store/cache client-side, preferencialmente com Zustand.
Adaptar as páginas do dashboard para Client Components.
Remover ou ignorar API Routes que dependem do banco.
Garantir que os dados persistam após atualizar a página.
Explicar quais arquivos devem ser alterados/removidos.
Mostrar o código necessário para a migração.
```
