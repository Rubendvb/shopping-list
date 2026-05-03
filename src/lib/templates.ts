import type { Priority, Unit } from '@/types'

export interface TemplateItem {
  name: string
  quantity: number
  unit?: Unit
  categoryId?: string
  priority: Priority
}

export interface Template {
  id: string
  name: string
  description: string
  items: TemplateItem[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'mercado-basico',
    name: 'Mercado básico',
    description: 'Itens essenciais para compras do dia a dia',
    items: [
      { name: 'Arroz', quantity: 2, unit: 'KG', categoryId: 'cat-mercado', priority: 'HIGH' },
      { name: 'Feijão', quantity: 1, unit: 'KG', categoryId: 'cat-mercado', priority: 'HIGH' },
      { name: 'Leite', quantity: 4, unit: 'L', categoryId: 'cat-frios', priority: 'HIGH' },
      { name: 'Ovos', quantity: 1, unit: 'UN', categoryId: 'cat-frios', priority: 'HIGH' },
      { name: 'Frango', quantity: 1, unit: 'KG', categoryId: 'cat-acougue', priority: 'HIGH' },
      { name: 'Carne', quantity: 1, unit: 'KG', categoryId: 'cat-acougue', priority: 'HIGH' },
      { name: 'Pão', quantity: 1, unit: 'UN', categoryId: 'cat-padaria', priority: 'MEDIUM' },
      { name: 'Café', quantity: 1, unit: 'UN', categoryId: 'cat-mercado', priority: 'HIGH' },
      { name: 'Açúcar', quantity: 1, unit: 'KG', categoryId: 'cat-mercado', priority: 'MEDIUM' },
      { name: 'Óleo', quantity: 1, unit: 'L', categoryId: 'cat-mercado', priority: 'MEDIUM' },
      { name: 'Macarrão', quantity: 2, unit: 'PCT', categoryId: 'cat-mercado', priority: 'MEDIUM' },
      { name: 'Papel higiênico', quantity: 1, unit: 'PCT', categoryId: 'cat-higiene', priority: 'HIGH' },
      { name: 'Presunto', quantity: 1, unit: 'UN', categoryId: 'cat-frios', priority: 'MEDIUM' },
      { name: 'Queijo', quantity: 1, unit: 'UN', categoryId: 'cat-frios', priority: 'MEDIUM' },
      { name: 'Manteiga', quantity: 1, unit: 'UN', categoryId: 'cat-frios', priority: 'MEDIUM' },
      { name: 'Margarina', quantity: 1, unit: 'UN', categoryId: 'cat-frios', priority: 'LOW' },
      { name: 'Iogurte', quantity: 4, unit: 'UN', categoryId: 'cat-frios', priority: 'LOW' },
      { name: 'Maionese', quantity: 1, unit: 'UN', categoryId: 'cat-mercado', priority: 'LOW' },
      { name: 'Ketchup', quantity: 1, unit: 'UN', categoryId: 'cat-mercado', priority: 'LOW' },
      { name: 'Mostarda', quantity: 1, unit: 'UN', categoryId: 'cat-mercado', priority: 'LOW' },
      { name: 'Cereal', quantity: 1, unit: 'UN', categoryId: 'cat-mercado', priority: 'LOW' },
      { name: 'Achocolatado', quantity: 1, unit: 'UN', categoryId: 'cat-mercado', priority: 'LOW' },
      { name: 'Biscoito', quantity: 2, unit: 'PCT', categoryId: 'cat-mercado', priority: 'LOW' },
    ],
  },
  {
    id: 'churrasco',
    name: 'Churrasco',
    description: 'Itens comuns para churrasco',
    items: [
      { name: 'Carne', quantity: 2, unit: 'KG', categoryId: 'cat-acougue', priority: 'HIGH' },
      { name: 'Linguiça', quantity: 1, unit: 'KG', categoryId: 'cat-acougue', priority: 'HIGH' },
      { name: 'Sal grosso', quantity: 1, unit: 'KG', categoryId: 'cat-acougue', priority: 'HIGH' },
      { name: 'Queijo coalho', quantity: 1, unit: 'KG', categoryId: 'cat-frios', priority: 'MEDIUM' },
      { name: 'Pão de alho', quantity: 2, unit: 'UN', categoryId: 'cat-padaria', priority: 'MEDIUM' },
      { name: 'Farofa', quantity: 1, unit: 'UN', categoryId: 'cat-mercado', priority: 'MEDIUM' },
      { name: 'Refrigerante', quantity: 4, unit: 'L', categoryId: 'cat-bebidas', priority: 'HIGH' },
      { name: 'Cerveja', quantity: 1, unit: 'UN', categoryId: 'cat-bebidas', priority: 'MEDIUM' },
      { name: 'Suco', quantity: 2, unit: 'L', categoryId: 'cat-bebidas', priority: 'LOW' },
      { name: 'Gelo', quantity: 2, unit: 'UN', categoryId: 'cat-congelados', priority: 'HIGH' },
      { name: 'Carvão', quantity: 2, unit: 'UN', categoryId: 'cat-outros', priority: 'HIGH' },
      { name: 'Descartáveis', quantity: 1, unit: 'UN', categoryId: 'cat-utilidades', priority: 'HIGH' },
    ],
  },
  {
    id: 'faxina',
    name: 'Faxina doméstica',
    description: 'Produtos básicos de limpeza',
    items: [
      { name: 'Detergente', quantity: 2, unit: 'UN', categoryId: 'cat-limpeza', priority: 'HIGH' },
      { name: 'Desinfetante', quantity: 1, unit: 'L', categoryId: 'cat-limpeza', priority: 'HIGH' },
      { name: 'Sabão líquido', quantity: 1, unit: 'L', categoryId: 'cat-limpeza', priority: 'HIGH' },
      { name: 'Água sanitária', quantity: 1, unit: 'L', categoryId: 'cat-limpeza', priority: 'HIGH' },
      { name: 'Esponja', quantity: 2, unit: 'UN', categoryId: 'cat-limpeza', priority: 'MEDIUM' },
      { name: 'Pano de chão', quantity: 1, unit: 'UN', categoryId: 'cat-limpeza', priority: 'MEDIUM' },
      { name: 'Luvas', quantity: 1, unit: 'UN', categoryId: 'cat-limpeza', priority: 'MEDIUM' },
      { name: 'Sacos de lixo', quantity: 1, unit: 'PCT', categoryId: 'cat-limpeza', priority: 'HIGH' },
      { name: 'Limpa vidros', quantity: 1, unit: 'UN', categoryId: 'cat-limpeza', priority: 'LOW' },
    ],
  },
  {
    id: 'festa',
    name: 'Festa',
    description: 'Itens comuns para organizar uma festa',
    items: [
      { name: 'Refrigerante', quantity: 4, unit: 'L', categoryId: 'cat-bebidas', priority: 'HIGH' },
      { name: 'Suco', quantity: 2, unit: 'L', categoryId: 'cat-bebidas', priority: 'MEDIUM' },
      { name: 'Salgadinhos', quantity: 3, unit: 'PCT', categoryId: 'cat-mercado', priority: 'HIGH' },
      { name: 'Bolo', quantity: 1, unit: 'UN', categoryId: 'cat-padaria', priority: 'HIGH' },
      { name: 'Gelo', quantity: 2, unit: 'UN', categoryId: 'cat-congelados', priority: 'MEDIUM' },
      { name: 'Descartáveis', quantity: 1, unit: 'UN', categoryId: 'cat-utilidades', priority: 'HIGH' },
      { name: 'Guardanapo', quantity: 2, unit: 'PCT', categoryId: 'cat-utilidades', priority: 'MEDIUM' },
    ],
  },
]
