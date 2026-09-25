import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'

// Tambahkan Promise pada searchParams untuk kompatibilitas Next.js 15+ (Turbopack)
export default async function ActivityNotes({
  searchParams
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  // 2. Proteksi Rute: Cek apakah user punya akses
  const cookieStore = await cookies()
  if (cookieStore.get('auth_granted')?.value !== 'true') {
    redirect('/') // Tendang kembali ke halaman PIN jika belum login
  }

  const resolvedParams = await searchParams
  const editId = resolvedParams?.edit

  const supabase = await createClient()

  // Ambil data
  const { data: notes, error } = await supabase
    .from('activity_notes_ayu')
    .select('*')
    .order('created_at', { ascending: false })

  // Mendapatkan string tanggal hari ini format YYYY-MM-DD untuk default input date
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // SERVER ACTION: Kunci Dashboard (Logout)
    async function lockDashboard() {
      'use server'
      const cookieStore = await cookies()
      cookieStore.delete('auth_granted')
      redirect('/')
    }
  // SERVER ACTION: Tambah Catatan
  async function addNote(formData: FormData) {
    'use server'
    const content = formData.get('content') as string
    const dateStr = formData.get('date') as string

    if (!content?.trim()) return

    // Tentukan waktu. Jika user memilih tanggal selain hari ini, set jam ke 12:00 siang
    let createdAt = new Date().toISOString()
    if (dateStr && dateStr !== todayStr) {
      createdAt = new Date(`${dateStr}T12:00:00Z`).toISOString()
    }

    const supabase = await createClient()
    await supabase.from('activity_notes_ayu').insert({
      content: content.trim(),
      created_at: createdAt
    })
    revalidatePath('/')
  }

  // SERVER ACTION: Hapus Catatan
  async function deleteNote(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const supabase = await createClient()
    await supabase.from('activity_notes_ayu').delete().eq('id', id)
    revalidatePath('/')
  }

  // SERVER ACTION: Update Catatan
  async function updateNote(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const content = formData.get('content') as string

    if (content?.trim()) {
      const supabase = await createClient()
      await supabase.from('activity_notes_ayu').update({ content: content.trim() }).eq('id', id)
    }
    // Hapus parameter ?edit dari URL setelah selesai
    redirect('/')
  }

  const noteCount = notes?.length ?? 0

  // Mengelompokkan data berdasarkan tanggal
  const groupedNotes = notes?.reduce((acc, note) => {
    const dateObj = new Date(note.created_at)
    const dateKey = dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(note)
    return acc
  }, {} as Record<string, typeof notes>) || {}

  const activeDays = Object.keys(groupedNotes).length

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 selection:bg-fuchsia-500/30 font-sans relative overflow-hidden">
      {/* Background Gradient & Glow Effects */}
      <div className="absolute top-0 inset-x-0 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navbar Minimalis */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">Act<span className="text-zinc-500">Notes</span></span>
          </div>
          <div className="text-sm font-medium text-zinc-400">
            {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {/* Tombol Logout/Kunci */}
                      <form action={lockDashboard}>
                        <button
                          type="submit"
                          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Kunci Dashboard"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </button>
                      </form>
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* KOLOM KIRI: Composer & Stats */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-2">
                Capture your day.
              </h1>
              <p className="text-zinc-400 text-lg">Catat aktivitas dan ide brilianmu dalam satu timeline.</p>
            </div>

            {/* Input Form Card */}
            <div className="p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 shadow-2xl">
              <div className="bg-[#121214] p-6 rounded-[14px] border border-white/5">
                <form action={addNote} className="flex flex-col gap-4">
                  <textarea
                    name="content"
                    required
                    rows={3}
                    placeholder="Apa aktivitasmu?"
                    className="w-full bg-transparent text-lg text-white placeholder-zinc-600 resize-none outline-none focus:ring-0"
                  />
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">

                    {/* Date Picker (Kiri) */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors focus-within:border-fuchsia-500/50">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <input
                          type="date"
                          name="date"
                          defaultValue={todayStr}
                          className="bg-transparent text-sm font-medium text-zinc-300 outline-none w-[120px] cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[0.8] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      <span>Simpan</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-zinc-400 text-sm font-medium mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Total Catatan
                </div>
                <div className="text-3xl font-bold text-white">{noteCount}</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-zinc-400 text-sm font-medium mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Hari Aktif
                </div>
                <div className="text-3xl font-bold text-white">{activeDays}</div>
              </div>
            </div>

          </div>

          {/* KOLOM KANAN: Scrollable Timeline Widget */}
          <div className="lg:col-span-5 h-full">
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl sticky top-24">
              <div className="bg-zinc-950/50 rounded-[22px] p-6 lg:h-[700px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">

                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Timeline
                  </h2>
                </div>

                {error ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    Gagal memuat data.
                  </div>
                ) : noteCount === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <p className="text-zinc-400 font-medium">Belum ada aktivitas</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedNotes).map(([date, dayNotes]) => (
                      <div key={date} className="relative">

                        {/* DESAIN TANGGAL BARU (Divider Elegan) */}
                        <div className="flex items-center gap-4 mb-6 mt-8 first:mt-0">
                          <div className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">
                            {date}
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent"></div>
                        </div>

                        {/* Timeline Container */}
                        <div className="relative mt-2 ml-2 space-y-4 border-l border-dashed border-zinc-700/70 pb-2">
                          {dayNotes.map((note) => (
                            <div key={note.id} className="relative pl-6 group">

                              {/* Glowing Dot Node */}
                              <div className="absolute left-[-5px] top-4 h-2.5 w-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.6)] group-hover:scale-125 transition-transform duration-300" />

                              {/* JIKA DALAM MODE EDIT */}
                              {editId === note.id ? (
                                <div className="bg-zinc-900/80 border border-fuchsia-500/50 p-4 rounded-2xl shadow-lg">
                                  <form action={updateNote} className="flex flex-col gap-3">
                                    <input type="hidden" name="id" value={note.id} />
                                    <textarea
                                      name="content"
                                      defaultValue={note.content}
                                      className="w-full bg-transparent text-[15px] text-white resize-none outline-none border-b border-zinc-700 pb-2 focus:border-fuchsia-500"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-2 items-center mt-1">
                                      <Link href="/" className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                                        Batal
                                      </Link>
                                      <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg transition-colors">
                                        Simpan
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              ) : (
                                /* MODE TAMPILAN NORMAL */
                                <div className="relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 p-4 rounded-2xl transition-all duration-300">
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

                                  {/* TOMBOL ACTION (MUNCUL SAAT DI-HOVER) */}
                                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                                    <Link
                                      href={`/?edit=${note.id}`}
                                      className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </Link>
                                    <form action={deleteNote}>
                                      <input type="hidden" name="id" value={note.id} />
                                      <button
                                        type="submit"
                                        className="p-1.5 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                                        title="Hapus"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              )}

                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
