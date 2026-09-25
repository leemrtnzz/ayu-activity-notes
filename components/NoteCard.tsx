'use client'

import { useState } from 'react'
import { deleteNoteAction, updateNoteAction } from '@/app/actions'
import { SubmitButton } from './SubmitButton'
import { DeleteButton } from './DeleteButton'

type NoteType = {
  id: string
  content: string
  created_at: string
}

export function NoteCard({ note }: { note: NoteType }) {
  const [isEditing, setIsEditing] = useState(false)

  // Fungsi untuk update tanpa redirect
  async function handleUpdate(formData: FormData) {
    const content = formData.get('content') as string
    await updateNoteAction(note.id, content)
    setIsEditing(false) // Tutup form secara instan setelah selesai
  }

  // Fungsi untuk hapus
  async function handleDelete() {
    await deleteNoteAction(note.id)
  }

  if (isEditing) {
    return (
      <div className="bg-zinc-900/80 border border-fuchsia-500/50 p-4 rounded-2xl shadow-lg relative group">
        <form action={handleUpdate} className="flex flex-col gap-3">
          <textarea
            name="content"
            defaultValue={note.content}
            className="w-full bg-transparent text-[16px] text-white resize-none outline-none border-b border-zinc-700 pb-2 focus:border-fuchsia-500"
            rows={2}
            autoFocus
          />
          <div className="flex justify-end gap-2 items-center mt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <SubmitButton className="px-4 py-1.5 text-xs font-semibold bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg transition-colors flex items-center justify-center">
              Simpan
            </SubmitButton>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 p-4 rounded-2xl transition-all duration-300 group">
      <div className="text-[15px] leading-relaxed text-zinc-200 pr-12">
        {note.content}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {new Date(note.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>

      {/* Action Buttons (Hover) */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <form action={handleDelete}>
          <DeleteButton />
        </form>
      </div>
    </div>
  )
}
