'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { BankSessionPayload } from '@/lib/auth/bank-session'
import { ApplicationStatus } from '@/lib/types'
import {
  validateKYCAction,
  requestMoreDocsAction,
  setInAnalysisAction,
  approveAction,
  rejectAction,
} from './actions'

interface ActionButtonsProps {
  applicationId: string
  status: ApplicationStatus
  session: BankSessionPayload
}

export function ActionButtons({ applicationId, status, session }: ActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [noteText, setNoteText] = useState('')
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isAgentOrAbove = ['agent', 'supervisor', 'admin'].includes(session.role)
  const isSupervisorOrAbove = ['supervisor', 'admin'].includes(session.role)

  async function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Statut mis à jour avec succès.' })
        setShowNoteFor(null)
        setNoteText('')
      }
    })
  }

  const NoteModal = ({ actionKey, label, onConfirm, variant = 'primary' }: {
    actionKey: string
    label: string
    onConfirm: (note: string) => void
    variant?: 'primary' | 'danger' | 'secondary'
  }) => (
    <div>
      {showNoteFor === actionKey ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Ajouter une note (optionnel)..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button variant={variant} size="sm" loading={isPending} onClick={() => onConfirm(noteText)}>
              Confirmer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNoteFor(null)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant={variant} size="sm" onClick={() => setShowNoteFor(actionKey)}>
          {label}
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-3">
      {message && (
        <div className={['rounded-lg p-3 text-sm', message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'].join(' ')}>
          {message.text}
        </div>
      )}

      {isAgentOrAbove && status === 'submitted' && (
        <Button size="sm" variant="secondary" loading={isPending} onClick={() => run(() => validateKYCAction(applicationId))}>
          Valider KYC
        </Button>
      )}

      {isAgentOrAbove && (status === 'submitted' || status === 'kyc_verification') && (
        <NoteModal
          actionKey="more_docs"
          label="Demander complément"
          onConfirm={(note) => run(() => requestMoreDocsAction(applicationId, note))}
          variant="secondary"
        />
      )}

      {isAgentOrAbove && status === 'kyc_verification' && (
        <Button size="sm" variant="secondary" loading={isPending} onClick={() => run(() => setInAnalysisAction(applicationId))}>
          Passer en analyse
        </Button>
      )}

      {isSupervisorOrAbove && status === 'analysis' && (
        <>
          <NoteModal
            actionKey="approve"
            label="Approuver"
            onConfirm={(note) => run(() => approveAction(applicationId, note))}
            variant="primary"
          />
          <NoteModal
            actionKey="reject"
            label="Rejeter"
            onConfirm={(note) => run(() => rejectAction(applicationId, note))}
            variant="danger"
          />
        </>
      )}

      {status === 'approved' && (
        <div className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">Demande approuvée ✓</div>
      )}

      {status === 'rejected' && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">Demande rejetée</div>
      )}
    </div>
  )
}
