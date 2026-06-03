'use client'

import { useState, useTransition } from 'react'
import { FileUpload } from '@/components/ui/FileUpload'
import { LoanDocument, DOCUMENT_LABELS, STANDARD_DOC_TYPES, DocumentType } from '@/lib/types'
import { resubmitDocumentsAction } from './actions'

interface SupplementaryUploadProps {
  applicationId: string
  agentNote: string | null
  docs: LoanDocument[]
}

export function SupplementaryUpload({ applicationId, agentNote, docs }: SupplementaryUploadProps) {
  const rejectedDocs = docs.filter((d) => d.status === 'rejected')
  const existingDocsMap = Object.fromEntries(docs.map((d) => [d.document_type, d.file_url]))

  // Track which docs have been (re-)uploaded this session
  const [reUploaded, setReUploaded] = useState<Set<DocumentType>>(new Set())

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Show all 5 standard slots if no specific docs were rejected, otherwise only rejected ones
  const slotsToShow: DocumentType[] =
    rejectedDocs.length > 0
      ? rejectedDocs.map((d) => d.document_type)
      : STANDARD_DOC_TYPES

  const allRejectedReUploaded =
    rejectedDocs.length === 0 ||
    rejectedDocs.every((d) => reUploaded.has(d.document_type))

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await resubmitDocumentsAction(applicationId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border-2 border-orange-200 bg-orange-50">
      {/* Header */}
      <div className="flex items-start gap-3 bg-orange-100 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-200">
          <svg className="h-5 w-5 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-orange-900">Documents complémentaires requis</p>
          <p className="mt-0.5 text-sm text-orange-700">
            {rejectedDocs.length > 0
              ? `${rejectedDocs.length} document${rejectedDocs.length > 1 ? 's ont été rejetés' : ' a été rejeté'}. Veuillez les soumettre à nouveau.`
              : 'Votre conseiller a demandé des pièces supplémentaires.'}
          </p>
        </div>
      </div>

      {/* Agent note */}
      {agentNote && (
        <div className="mx-5 mt-4 flex items-start gap-3 rounded-lg border border-orange-200 bg-white px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
              Message de votre conseiller
            </p>
            <p className="text-sm text-gray-800">{agentNote}</p>
          </div>
        </div>
      )}

      {/* Rejected docs summary */}
      {rejectedDocs.length > 0 && (
        <div className="mx-5 mt-4 space-y-1.5">
          {rejectedDocs.map((doc) => (
            <div key={doc.id} className="flex items-start gap-2 rounded-lg border border-red-200 bg-white px-3 py-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700">
                  {DOCUMENT_LABELS[doc.document_type as DocumentType]}
                </p>
                {doc.reject_reason && (
                  <p className="text-xs text-gray-600 mt-0.5">"{doc.reject_reason}"</p>
                )}
              </div>
              {reUploaded.has(doc.document_type) && (
                <svg className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload slots */}
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        {slotsToShow.map((docType) => {
          const rejectedDoc = rejectedDocs.find((d) => d.document_type === docType)
          return (
            <div
              key={docType}
              className={rejectedDoc ? 'rounded-xl ring-2 ring-red-300 ring-offset-2' : ''}
            >
              <FileUpload
                documentType={docType}
                applicationId={applicationId}
                existingUrl={existingDocsMap[docType]}
                onUploaded={() => setReUploaded((prev) => new Set([...prev, docType]))}
              />
            </div>
          )
        })}

        {/* 6th slot — additional document */}
        <div className="rounded-xl ring-1 ring-dashed ring-primary-300 ring-offset-2">
          <FileUpload
            documentType="additional"
            applicationId={applicationId}
            existingUrl={existingDocsMap['additional']}
            onUploaded={() => setReUploaded((prev) => new Set([...prev, 'additional']))}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-orange-200 bg-orange-50 px-5 py-4">
        <div className="text-sm text-orange-700">
          {rejectedDocs.length > 0 ? (
            <>
              <span className="font-semibold text-green-700">{reUploaded.size}</span>
              <span className="text-gray-500"> / {slotsToShow.length} documents resoumis</span>
            </>
          ) : (
            <span className="text-gray-500">{reUploaded.size} document(s) ajouté(s)</span>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {!allRejectedReUploaded && (
            <p className="text-xs text-orange-600">
              Veuillez re-soumettre tous les documents rejetés.
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allRejectedReUploaded || isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Envoi en cours…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Envoyer mes documents
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
