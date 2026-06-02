import { verifyClientSession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Step1Identity } from './steps/Step1Identity'
import { Step2Professional } from './steps/Step2Professional'
import { Step3Financial } from './steps/Step3Financial'
import { Step4LoanRequest } from './steps/Step4LoanRequest'
import { Step5KYC } from './steps/Step5KYC'
import { Step5Confirm } from './steps/Step5Confirm'
import { Card } from '@/components/ui/Card'

const STEPS = [
  { label: 'Identité' },
  { label: 'Profession' },
  { label: 'Finances' },
  { label: 'Crédit' },
  { label: 'KYC' },
  { label: 'Confirmation' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
      {STEPS.map((step, idx) => {
        const num = idx + 1
        const done = num < current
        const active = num === current

        return (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                  done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400',
                ].join(' ')}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : num}
              </div>
              <span className={['text-xs', active ? 'font-medium text-blue-700' : 'text-gray-400'].join(' ')}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={['mb-5 h-px w-6 lg:w-8', done ? 'bg-green-400' : 'bg-gray-200'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; id?: string }>
}) {
  const params = await searchParams
  const step = parseInt(params.step ?? '1', 10)
  const applicationId = params.id ?? null

  await verifyClientSession()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  let application = null
  if (applicationId) {
    const { data } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('client_id', user!.id)
      .single()
    application = data
  }

  // Load existing KYC docs for step 5
  let existingDocs: Record<string, string> = {}
  if (step === 5 && applicationId) {
    const { data: docs } = await supabase
      .from('loan_documents')
      .select('document_type, file_url')
      .eq('application_id', applicationId)
    if (docs) {
      existingDocs = Object.fromEntries(docs.map((d) => [d.document_type, d.file_url]))
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demande de crédit</h1>
        <p className="text-sm text-gray-500">Complétez les 6 étapes pour soumettre votre dossier</p>
      </div>

      <StepIndicator current={step} />

      <Card>
        {step === 1 && <Step1Identity profile={profile} applicationId={applicationId} />}
        {step === 2 && <Step2Professional profile={profile} applicationId={applicationId!} />}
        {step === 3 && <Step3Financial profile={profile} applicationId={applicationId!} />}
        {step === 4 && <Step4LoanRequest application={application} applicationId={applicationId!} />}
        {step === 5 && <Step5KYC applicationId={applicationId!} existingDocs={existingDocs} />}
        {step === 6 && <Step5Confirm profile={profile} application={application} applicationId={applicationId!} />}
      </Card>
    </div>
  )
}
