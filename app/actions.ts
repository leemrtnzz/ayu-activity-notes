'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function addNoteAction(formData: FormData) {
  const content = formData.get('content') as string
  const dateStr = formData.get('date') as string

  if (!content?.trim()) return

  let createdAt = new Date().toISOString()
  if (dateStr) {
    const localDate = new Date(dateStr)
    createdAt = new Date(localDate.getTime() - (7 * 60 * 60 * 1000)).toISOString()
  }

  const supabase = await createClient()
  await supabase.from('activity_notes_ayu').insert({
    content: content.trim(),
    created_at: createdAt
  })
  revalidatePath('/dashboard')
}

export async function deleteNoteAction(id: string) {
  const supabase = await createClient()
  await supabase.from('activity_notes_ayu').delete().eq('id', id)
  revalidatePath('/dashboard')
}

export async function updateNoteAction(id: string, content: string) {
  if (content?.trim()) {
    const supabase = await createClient()
    await supabase.from('activity_notes_ayu').update({ content: content.trim() }).eq('id', id)
    revalidatePath('/dashboard')
  }
}
