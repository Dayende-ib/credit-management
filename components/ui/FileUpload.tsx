'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { DocumentType, DOCUMENT_LABELS } from '@/lib/types'

interface FileUploadProps {
  documentType: DocumentType
  applicationId: string
  onUploaded?: (url: string) => void
  existingUrl?: string
}

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf')
}

function PreviewImage({ url, label }: { url: string; label: string }) {
  if (isPdf(url)) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800">{label}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
            Ouvrir le PDF →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200">
      <Image
        src={url}
        alt={label}
        width={400}
        height={240}
        className="h-48 w-full object-cover"
        unoptimized
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity hover:opacity-100"
      >
        <span className="text-xs font-medium text-white">Voir en plein écran →</span>
      </a>
    </div>
  )
}

export function FileUpload({ documentType, applicationId, onUploaded, existingUrl }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const label = DOCUMENT_LABELS[documentType]
  const uploaded = !!previewUrl

  async function handleFile(file: File) {
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG, PNG, WebP ou PDF.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 5 Mo).')
      return
    }

    // Show local preview immediately for images
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file)
      setLocalPreview(objectUrl)
    } else {
      setLocalPreview(null)
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    formData.append('applicationId', applicationId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur upload')

      setPreviewUrl(data.url)
      setLocalPreview(null)
      onUploaded?.(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléversement')
      setLocalPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const activePreview = localPreview ?? (uploaded && !isPdf(previewUrl!) ? previewUrl : null)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </p>

      {/* Preview area */}
      {(activePreview || (uploaded && previewUrl)) && !uploading && (
        <div className="mb-1">
          {activePreview ? (
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
              <Image
                src={activePreview}
                alt={label}
                width={400}
                height={240}
                className="h-48 w-full object-cover"
                unoptimized
              />
              {localPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              {!localPreview && previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity hover:opacity-100"
                >
                  <span className="text-xs font-medium text-white">Voir en plein écran →</span>
                </a>
              )}
            </div>
          ) : previewUrl && isPdf(previewUrl) ? (
            <PreviewImage url={previewUrl} label={label} />
          ) : null}
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={[
          'flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors',
          dragOver ? 'border-blue-400 bg-blue-50' : uploaded ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          uploading ? 'cursor-wait opacity-60' : '',
        ].join(' ')}
      >
        {uploading ? (
          <>
            <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Téléversement en cours...</p>
          </>
        ) : uploaded ? (
          <>
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-green-700">Téléversé - cliquer pour remplacer</p>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Glisser-déposer ou cliquer</p>
              <p className="text-xs text-gray-500">JPG, PNG, WebP, PDF - max 5 Mo</p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
