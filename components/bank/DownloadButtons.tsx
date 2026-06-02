'use client'

import { useState } from 'react'

interface DownloadButtonsProps {
  applicationId: string
  applicationNumber: string
}

function DownloadButton({
  href,
  label,
  icon,
  ext,
  color,
}: {
  href: string
  label: string
  icon: React.ReactNode
  ext: string
  color: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error('Erreur génération')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dossier.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Erreur lors de la génération du document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={[
        'flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
        'border disabled:cursor-not-allowed disabled:opacity-60',
        color,
      ].join(' ')}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        icon
      )}
      {loading ? 'Génération…' : label}
    </button>
  )
}

export function DownloadButtons({ applicationId, applicationNumber }: DownloadButtonsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Télécharger le dossier
      </p>
      <div className="flex flex-col gap-2">
        <DownloadButton
          href={`/api/download/${applicationId}/pdf`}
          label="Télécharger en PDF"
          ext="pdf"
          color="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <DownloadButton
          href={`/api/download/${applicationId}/docx`}
          label="Télécharger en Word"
          ext="docx"
          color="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>
      <p className="mt-2 text-xs text-gray-400">Dossier {applicationNumber}</p>
    </div>
  )
}
