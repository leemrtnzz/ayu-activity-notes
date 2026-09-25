import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { addNoteAction } from '@/app/actions'
import { NoteCard } from '@/components/NoteCard'
import { SubmitButton } from '@/components/SubmitButton'

type NoteType = {
  id: string;
  content: string;
  created_at: string;
}

export default async function ActivityNotes() {
  const cookieStore = await cookies()
  if (cookieStore.get('auth_granted')?.value !== 'true') {
    redirect('/')
  }

  const supabase = await createClient()

  const { data: notes, error } = await supabase
    .from('activity_notes_ayu')
    .select('*')
    .order('created_at', { ascending: false })

  const now = new Date();
  const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));

  const y = jakartaTime.getUTCFullYear();
  const m = String(jakartaTime.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jakartaTime.getUTCDate()).padStart(2, '0');
  const h = String(jakartaTime.getUTCHours()).padStart(2, '0');
  const min = String(jakartaTime.getUTCMinutes()).padStart(2, '0');
  const defaultDateTime = `${y}-${m}-${d}T${h}:${min}`;

  async function lockDashboard() {
    'use server'
    const cookieStore = await cookies()
    cookieStore.delete('auth_granted')
    redirect('/')
  }

  const noteCount = notes?.length ?? 0

  const groupedNotes = (notes || []).reduce<Record<string, NoteType[]>>((acc, note: any) => {
    const dateObj = new Date(note.created_at)
    const dateKey = dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(note as NoteType)

    return acc
  }, {})

  const activeDays = Object.keys(groupedNotes).length

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans relative overflow-hidden">
      {/* Background Gradients (tetap sama) */}
      <div className="absolute top-0 inset-x-0 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Navbar (tetap sama) */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">Act<span className="text-zinc-500">Notes</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-zinc-400 hidden sm:block">
              {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <form action={lockDashboard}>
              <button type="submit" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* KOLOM KIRI */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-2">
                Capture your day.
              </h1>
              <p className="text-zinc-400 text-lg">Catat aktivitas.</p>
            </div>

            <div className="p-1 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 shadow-2xl">
              <div className="bg-[#121214] p-6 rounded-[14px] border border-white/5">
                <form action={addNoteAction} className="flex flex-col gap-4">
                  <textarea
                    name="content"
                    required
                    rows={3}
                    placeholder="Apa aktivitasmu?"
                    className="w-full bg-transparent text-[16px] text-white placeholder-zinc-600 resize-none outline-none focus:ring-0"
                  />
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors focus-within:border-fuchsia-500/50">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                          type="datetime-local"
                          name="date"
                          defaultValue={defaultDateTime}
                          className="bg-transparent text-[16px] font-medium text-zinc-300 outline-none w-[125px] cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[0.8] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                        />
                      </div>
                    </div>
                    <SubmitButton className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      <span>Simpan</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </SubmitButton>
                  </div>
                </form>
              </div>
            </div>

            {/* Stats (tetap sama) */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-zinc-400 text-sm font-medium mb-1">Total Catatan</div>
                <div className="text-3xl font-bold text-white">{noteCount}</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-zinc-400 text-sm font-medium mb-1">Hari Aktif</div>
                <div className="text-3xl font-bold text-white">{activeDays}</div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Timeline */}
          <div className="lg:col-span-5 h-full">
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl sticky top-24">
              <div className="bg-zinc-950/50 rounded-[22px] p-6 lg:h-[700px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-white">Timeline</h2>
                </div>

                {error ? (
                  <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm">Gagal memuat data.</div>
                ) : noteCount === 0 ? (
                  <div className="text-zinc-400 text-center py-10">Belum ada aktivitas</div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedNotes).map(([date, dayNotes]) => (
                      <div key={date} className="relative">
                        <div className="flex items-center gap-4 mb-6 mt-8 first:mt-0">
                          <div className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">{date}</div>
                          <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent"></div>
                        </div>

                        <div className="relative mt-2 ml-2 space-y-4 border-l border-dashed border-zinc-700/70 pb-2">
                          {dayNotes.map((note) => (
                            <div key={note.id} className="relative pl-6">
                              <div className="absolute left-[-5px] top-4 h-2.5 w-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.6)]" />
                              {/* RENDER COMPONENT CLIENT DI SINI */}
                              <NoteCard note={note} />
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
