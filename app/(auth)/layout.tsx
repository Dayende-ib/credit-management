import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary-400 p-12">
        <Image src="/logo.webp" alt="BPBF" width={220} height={80} className="object-contain mb-10" style={{ height: 'auto' }} priority />
        <h2 className="text-3xl font-bold text-white text-center leading-snug">
          Votre crédit en ligne,<br />
          <span className="text-accent-400">simple et rapide</span>
        </h2>
        <p className="mt-4 text-primary-200 text-center max-w-sm">
          Soumettez votre demande en quelques étapes, suivez l&apos;avancement en temps réel.
        </p>
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          {[
            { label: 'Étapes', value: '6' },
            { label: 'Délai moyen', value: '48h' },
            { label: 'en ligne', value: '100%' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-primary-700/50 px-4 py-3">
              <p className="text-2xl font-bold text-accent-400">{s.value}</p>
              <p className="text-xs text-primary-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-gray-50 p-8">
        {/* Mobile logo */}
        <div className="mb-6 lg:hidden">
          <Image src="/logo.webp" alt="BPBF" width={140} height={50} className="object-contain" style={{ height: 'auto' }} priority />
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
