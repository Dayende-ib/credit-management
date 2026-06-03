'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Image from 'next/image'
import { LoanDocument, DOCUMENT_LABELS, DocumentType } from '@/lib/types'
import { rejectDocumentAction, approveDocumentAction } from './actions'

function RejectModal({
  doc,
  applicationId,
  onClose,
}: {
  doc: LoanDocument
  applicationId: string
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleReject() {
    startTransition(async () => {
      await rejectDocumentAction(doc.id, applicationId, reason)
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Rejeter le document</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {DOCUMENT_LABELS[doc.document_type as DocumentType]}
            </p>
          </div>
          <button onClick={onClose} className="ml-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Motif du rejet <span className="text-xs font-normal text-gray-400">(optionnel)</span>
          </label>
          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex : Photo floue, document expiré, mauvais document..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Rejeter ce document
          </button>
        </div>
      </div>
    </div>
  )
}

function DocCard({
  doc,
  applicationId,
}: {
  doc: LoanDocument
  applicationId: string
}) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isPdf = doc.file_url.toLowerCase().includes('.pdf')
  const label = DOCUMENT_LABELS[doc.document_type as DocumentType]

  const isRejected = doc.status === 'rejected'
  const isApproved = doc.status === 'approved'

  function handleApprove() {
    startTransition(async () => {
      await approveDocumentAction(doc.id, applicationId)
    })
  }

  return (
    <>
      {showRejectModal && (
        <RejectModal
          doc={doc}
          applicationId={applicationId}
          onClose={() => setShowRejectModal(false)}
        />
      )}

      <div className={[
        'flex flex-col overflow-hidden rounded-xl border-2 transition-all',
        isRejected ? 'border-red-300 bg-red-50' : isApproved ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white',
      ].join(' ')}>

        {/* Preview */}
        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="group relative block">
          {isPdf ? (
            <div className="flex h-36 flex-col items-center justify-center gap-2 bg-red-50">
              <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-red-500">PDF</span>
            </div>
          ) : (
            <div className="relative h-36 bg-gray-100">
              <Image src={doc.file_url} alt={label} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          )}

          {/* Status overlay badge */}
          <div className="absolute right-2 top-2">
            {isRejected && (
              <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rejeté
              </span>
            )}
            {isApproved && (
              <span className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Validé
              </span>
            )}
          </div>
        </a>

        {/* Info */}
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-800 truncate">{label}</p>
          <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
          {isRejected && doc.reject_reason && (
            <p className="mt-1 text-xs text-red-600 italic">"{doc.reject_reason}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 border-t border-gray-100 px-3 py-2">
          {!isApproved && (
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-50 px-2 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Valider
            </button>
          )}
          {!isRejected && (
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rejeter
            </button>
          )}
          {isRejected && (
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              Annuler rejet
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export function KycDocuments({
  docs,
  applicationId,
}: {
  docs: LoanDocument[]
  applicationId: string
}) {
  const rejectedCount = docs.filter((d) => d.status === 'rejected').length
  const approvedCount = docs.filter((d) => d.status === 'approved').length

  return (
    <div>
      {/* Summary badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">{docs.length} / 6 documents</span>
        {approvedCount > 0 && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            {approvedCount} validé{approvedCount > 1 ? 's' : ''}
          </span>
        )}
        {rejectedCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {rejectedCount} rejeté{rejectedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {docs.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {docs.map((doc) => (
            <DocCard key={doc.id} doc={doc} applicationId={applicationId} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-gray-50 py-8 text-center">
          <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-400">Aucun document téléversé</p>
        </div>
      )}
    </div>
  )
}
