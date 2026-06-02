'use client'

import { useActionState, useState } from 'react'
import { proceedToConfirm, StepState } from '../actions'
import { FileUpload } from '@/components/ui/FileUpload'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { DocumentType } from '@/lib/types'

const initialState: StepState = {}

const REQUIRED_DOCS: DocumentType[] = ['id_front', 'id_back', 'selfie', 'income_proof', 'address_proof']

export function Step5KYC({
  applicationId,
  existingDocs,
}: {
  applicationId: string
  existingDocs: Record<string, string>
}) {
  const [state, formAction, pending] = useActionState(proceedToConfirm, initialState)
  const [uploadedDocs, setUploadedDocs] = useState<Set<DocumentType>>(
    new Set(Object.keys(existingDocs) as DocumentType[])
  )

  const allUploaded = REQUIRED_DOCS.every((doc) => uploadedDocs.has(doc))

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Documents KYC</h2>
      <p className="mb-6 text-sm text-gray-500">Étape 5 sur 6 - Téléversez vos justificatifs</p>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <div className="flex flex-col gap-5 mb-6">
        {REQUIRED_DOCS.map((docType) => (
          <FileUpload
            key={docType}
            documentType={docType}
            applicationId={applicationId}
            existingUrl={existingDocs[docType]}
            onUploaded={() => setUploadedDocs((prev) => new Set([...prev, docType]))}
          />
        ))}
      </div>

      {!allUploaded && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Veuillez téléverser tous les documents requis avant de continuer.
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="application_id" value={applicationId} />
        <div className="flex justify-between">
          <Link href={`/client/application/new?step=4&id=${applicationId}`}>
            <Button variant="outline">← Retour</Button>
          </Link>
          <Button type="submit" loading={pending} disabled={!allUploaded}>
            Suivant →
          </Button>
        </div>
      </form>
    </div>
  )
}
