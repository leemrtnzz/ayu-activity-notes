import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PinGatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // Cek jika sudah login, langsung arahkan ke dashboard
  const cookieStore = await cookies()
  if (cookieStore.get('auth_granted')?.value === 'true') {
    redirect('/dashboard')
  }

  const resolvedParams = await searchParams
  const isError = resolvedParams?.error === 'invalid'

  // SERVER ACTION: Verifikasi PIN
  async function verifyPin(formData: FormData) {
    'use server'
    const pin = formData.get('pin') as string
    const validPin = process.env.PIN_CODE

    if (pin === validPin) {
      const cookieStore = await cookies()
      cookieStore.set('auth_granted', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // Sesi berlaku 7 hari
      })
      redirect('/dashboard')
    } else {
      redirect('/?error=invalid')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-200 font-sans">

      {/* PIN Card Minimalis Flat */}
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#121214] border border-zinc-800 shadow-xl text-center">

        <div className="mx-auto w-12 h-12 mb-6 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">Private Area</h1>
        <p className="text-zinc-500 text-sm mb-8">Masukkan PIN untuk mengakses catatan.</p>

        <form action={verifyPin} className="flex flex-col gap-4">
          <input
            type="password"
            name="pin"
            required
            autoFocus
            placeholder="••••••"
            className={`w-full bg-black text-center tracking-[0.5em] text-xl font-mono text-white placeholder-zinc-800 py-3 rounded-lg border outline-none transition-colors ${
              isError ? 'border-red-900 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-500'
            }`}
          />

          {isError && (
            <span className="text-red-500 text-xs font-medium -mt-2">PIN yang dimasukkan salah.</span>
          )}

          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg bg-zinc-100 text-black font-medium hover:bg-white transition-colors active:scale-95"
          >
            Buka Kunci
          </button>
        </form>

      </div>
    </div>
  )
}
