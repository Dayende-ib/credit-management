'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { BankSessionPayload } from '@/lib/auth/bank-session'
import { ApplicationStatus } from '@/lib/types'
import {
  validateKYCAction,
  requestMoreDocsAction,
  setInAnalysisAction,
  approveAction,
  rejectAction,
} from './actions'

// ── Confirmation modal ────────────────────────────────────────────────────────

type ModalConfig = {
  title: string
  description: string
  confirmLabel: string
  confirmColor: string
  withNote?: boolean
  noteLabel?: string
  notePlaceholder?: string
}

function ConfirmModal({
  config,
  isPending,
  onConfirm,
  onClose,
}: {
  config: ModalConfig
  isPending: boolean
  onConfirm: (note: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-focus textarea if present, otherwise focus won't get lost
  useEffect(() => {
    if (config.withNote) textareaRef.current?.focus()
  }, [config.withNote])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{config.title}</h3>
            <p className="mt-0.5 text-sm text-gray-500">{config.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {config.withNote && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {config.noteLabel ?? 'Note interne'}
                <span className="ml-1 text-xs font-normal text-gray-400">(optionnel)</span>
              </label>
              <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={config.notePlaceholder ?? 'Ajouter une note...'}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isPending}
            className={[
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              config.confirmColor,
            ].join(' ')}
          >
            {isPending && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Action button ─────────────────────────────────────────────────────────────

function ActionBtn({
  label,
  icon,
  colorClass,
  onClick,
  disabled,
}: {
  label: string
  icon: React.ReactNode
  colorClass: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50',
        colorClass,
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconCheck = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconDocs = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const IconAnalysis = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const IconApprove = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)
const IconReject = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ── Main component ────────────────────────────────────────────────────────────

interface ActionButtonsProps {
  applicationId: string
  status: ApplicationStatus
  session: BankSessionPayload
}

type ActiveAction = 'validate_kyc' | 'more_docs' | 'analysis' | 'approve' | 'reject' | null

const MODAL_CONFIGS: Record<Exclude<ActiveAction, null>, ModalConfig> = {
  validate_kyc: {
    title: 'Valider les documents KYC',
    description: 'Confirmez que tous les documents soumis sont valides. Le dossier passera en attente d\'analyse.',
    confirmLabel: 'Valider KYC',
    confirmColor: 'bg-primary-600 hover:bg-primary-700',
    withNote: true,
    noteLabel: 'Observation',
    notePlaceholder: 'Documents conformes, aucune anomalie détectée...',
  },
  more_docs: {
    title: 'Demander un nouveau document',
    description: 'Le client devra fournir un document supplémentaire non prévu initialement. Pour les documents KYC à corriger, utilisez "Rejeter KYC" sur le document concerné.',
    confirmLabel: 'Envoyer la demande',
    confirmColor: 'bg-orange-500 hover:bg-orange-600',
    withNote: true,
    noteLabel: 'Nature du document demandé',
    notePlaceholder: 'Ex : Attestation employeur, relevé bancaire des 3 derniers mois...',
  },
  analysis: {
    title: 'Passer le dossier en analyse',
    description: 'Le dossier sera transmis pour analyse financière approfondie.',
    confirmLabel: 'Passer en analyse',
    confirmColor: 'bg-purple-600 hover:bg-purple-700',
    withNote: false,
  },
  approve: {
    title: 'Approuver la demande',
    description: 'Le client sera notifié de l\'approbation de son crédit.',
    confirmLabel: 'Approuver',
    confirmColor: 'bg-green-600 hover:bg-green-700',
    withNote: true,
    noteLabel: 'Conditions / remarques',
    notePlaceholder: 'Conditions d\'approbation, montant final accordé...',
  },
  reject: {
    title: 'Rejeter la demande',
    description: 'Cette action est définitive. Le client sera notifié du rejet.',
    confirmLabel: 'Confirmer le rejet',
    confirmColor: 'bg-red-600 hover:bg-red-700',
    withNote: true,
    noteLabel: 'Motif du rejet',
    notePlaceholder: 'Indiquez le motif du rejet pour le client...',
  },
}

export function ActionButtons({ applicationId, status, session }: ActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<ActiveAction>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isAgentOrAbove = ['agent', 'supervisor', 'admin'].includes(session.role)
  const isSupervisorOrAbove = ['supervisor', 'admin'].includes(session.role)

  async function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    startTransition(async () => {
      const result = await action()
      setActiveAction(null)
      if (result.error) {
        setFeedback({ type: 'error', text: result.error })
      } else {
        setFeedback({ type: 'success', text: 'Statut mis à jour avec succès.' })
      }
    })
  }

  function handleConfirm(note: string) {
    if (!activeAction) return
    const actions: Record<Exclude<ActiveAction, null>, () => Promise<{ error?: string; success?: boolean }>> = {
      validate_kyc: () => validateKYCAction(applicationId),
      more_docs:    () => requestMoreDocsAction(applicationId, note),
      analysis:     () => setInAnalysisAction(applicationId),
      approve:      () => approveAction(applicationId, note),
      reject:       () => rejectAction(applicationId, note),
    }
    run(actions[activeAction])
  }

  return (
    <>
      {/* Modal */}
      {activeAction && (
        <ConfirmModal
          config={MODAL_CONFIGS[activeAction]}
          isPending={isPending}
          onConfirm={handleConfirm}
          onClose={() => setActiveAction(null)}
        />
      )}

      <div className="space-y-2">
        {feedback && (
          <div className={['mb-2 rounded-lg px-3 py-2.5 text-sm', feedback.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'].join(' ')}>
            {feedback.text}
          </div>
        )}

        {/* ── En attente du client ─────────────────────────── */}
        {status === 'additional_docs_required' && (
          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-sm text-orange-700 border border-orange-200 mb-1">
            {IconDocs}
            <span className="font-medium">En attente des documents client</span>
          </div>
        )}

        {/* ── Valider KYC ────────────────────────────────── */}
        {isAgentOrAbove && (
          status === 'submitted' ||
          status === 'kyc_verification' ||
          status === 'additional_docs_required'
        ) && (
          <ActionBtn
            label={status === 'additional_docs_required' ? 'Marquer documents reçus' : 'Valider KYC'}
            icon={IconCheck}
            colorClass="bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200"
            onClick={() => setActiveAction('validate_kyc')}
            disabled={isPending}
          />
        )}

        {/* ── Passer en analyse ──────────────────────────── */}
        {isAgentOrAbove && (
          status === 'kyc_verification' ||
          status === 'additional_docs_required'
        ) && (
          <ActionBtn
            label="Passer en analyse"
            icon={IconAnalysis}
            colorClass="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            onClick={() => setActiveAction('analysis')}
            disabled={isPending}
          />
        )}

        {/* ── Nouveau document requis ────────────────────── */}
        {isAgentOrAbove && (
          status === 'submitted' ||
          status === 'kyc_verification' ||
          status === 'analysis'
        ) && (
          <ActionBtn
            label="Nouveau document requis"
            icon={IconDocs}
            colorClass="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            onClick={() => setActiveAction('more_docs')}
            disabled={isPending}
          />
        )}

        {/* ── Approuver / Rejeter ────────────────────────── */}
        {isSupervisorOrAbove && status === 'analysis' && (
          <>
            <ActionBtn
              label="Approuver"
              icon={IconApprove}
              colorClass="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              onClick={() => setActiveAction('approve')}
              disabled={isPending}
            />
            <ActionBtn
              label="Rejeter"
              icon={IconReject}
              colorClass="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              onClick={() => setActiveAction('reject')}
              disabled={isPending}
            />
          </>
        )}

        {/* ── Rejeter la demande en attente docs ─────────── */}
        {isSupervisorOrAbove && status === 'additional_docs_required' && (
          <ActionBtn
            label="Rejeter la demande"
            icon={IconReject}
            colorClass="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
            onClick={() => setActiveAction('reject')}
            disabled={isPending}
          />
        )}

        {/* ── Statuts finaux ─────────────────────────────── */}
        {status === 'approved' && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 border border-green-200">
            {IconApprove} Demande approuvée
          </div>
        )}

        {status === 'rejected' && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 border border-red-200">
            {IconReject} Demande rejetée
          </div>
        )}
      </div>
    </>
  )
}
