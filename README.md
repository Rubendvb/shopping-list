# ListaFácil

Gerenciador de listas de compras para uso pessoal. Roda 100% no navegador — sem backend, sem banco de dados, sem Docker.

## Funcionalidades

- Criar e gerenciar listas de compras com orçamento
- Adicionar e editar itens (quantidade, unidade, preço estimado, preço real, categoria, prioridade, notas)
- Marcar itens como comprados
- Filtrar por categoria, status e buscar por nome
- Ordenação por prioridade, nome, categoria ou manual (drag & drop)
- Barra de orçamento colorida (verde / laranja / vermelho) com saldo restante ou ultrapassado
- Modo de compras: exibe apenas o essencial para usar com o celular na mão
- Duplicar listas e criar a partir de templates pré-configurados
- Concluir lista → gera snapshot no histórico
- Histórico expandível com detalhe completo de cada compra
- Estatísticas com filtro de período: gastos por categoria, gráfico mensal, sugestões inteligentes
- Compartilhar lista como texto (Web Share API ou cópia para clipboard)
- Exportar e importar dados como JSON (backup entre dispositivos)
- Categorias padrão + personalizadas
- Dark mode
- Layout responsivo (sidebar + hamburger mobile)
- PWA instalável

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
| Drag & Drop           | @dnd-kit                  |

## Comandos

```bash
npm run dev           # Servidor de desenvolvimento
npm run build         # Build de produção
npm run lint          # ESLint
npm run lint:fix      # ESLint + auto-fix
npm run format        # Prettier write
npm run format:check  # Prettier check
```
