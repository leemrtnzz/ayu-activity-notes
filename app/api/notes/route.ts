import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  // Tambahkan await
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_notes_ayu')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { content } = await request.json()

  if (!content) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  // Tambahkan await
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activity_notes_ayu')
    .insert({ content })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
