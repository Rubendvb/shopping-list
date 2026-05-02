# ListaFácil

Gerenciador de listas de compras para uso pessoal. Roda 100% no navegador — sem backend, sem banco de dados, sem Docker.

## Funcionalidades

- Criar e gerenciar listas de compras com orçamento
- Adicionar itens com quantidade, unidade, preço estimado, categoria e prioridade
- Marcar itens como comprados
- Filtrar por categoria, status e buscar por nome
- Alerta visual quando orçamento é ultrapassado
- Concluir lista → gera snapshot no histórico
- Histórico com comparação estimado vs real
- Estatísticas: gastos por categoria, gráfico mensal, itens mais comprados, sugestões
- Categorias padrão + personalizadas
- Dark mode
- Layout responsivo (sidebar + hamburger mobile)

## Setup

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`. Sem variáveis de ambiente. Dados persistem em localStorage.

## Stack

| Camada                | Tecnologia                |
| --------------------- | ------------------------- |
| Framework             | Next.js 16 (App Router)   |
| Linguagem             | TypeScript                |
| Estilização           | Tailwind CSS v4           |
| Estado / Persistência | Zustand v5 + localStorage |
| UI primitivos         | Radix UI                  |
| Ícones                | lucide-react              |
| Tema                  | next-themes               |

## Comandos

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run lint     # ESLint
```
