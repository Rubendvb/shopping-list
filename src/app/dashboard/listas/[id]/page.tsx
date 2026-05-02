'use client'
import { useParams } from 'next/navigation'
import { ListDetailClient } from './list-detail-client'

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <ListDetailClient listId={id} />
}
