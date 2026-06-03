export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'kyc_verification'
  | 'analysis'
  | 'additional_docs_required'
  | 'approved'
  | 'rejected'
  | 'disbursed'

export type DocumentType =
  | 'id_front'
  | 'id_back'
  | 'selfie'
  | 'income_proof'
  | 'address_proof'
  | 'additional'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export type InternalRole = 'agent' | 'supervisor' | 'admin'

export type LoanType = 'personal' | 'auto' | 'mortgage' | 'business' | 'education'

export type ContractType = 'cdi' | 'cdd' | 'freelance' | 'retired' | 'other'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  email: string
  date_of_birth: string | null
  gender: string | null
  nationality: string | null
  address: string | null
  profession: string | null
  employer: string | null
  seniority_years: number | null
  contract_type: ContractType | null
  monthly_income: number | null
  monthly_expenses: number | null
  other_credits: number | null
  created_at: string
}

export interface InternalUser {
  id: string
  email: string
  full_name: string
  role: InternalRole
  is_active: boolean
  created_at: string
}

export interface LoanApplication {
  id: string
  application_number: string
  client_id: string
  loan_type: LoanType | null
  amount: number | null
  duration_months: number | null
  purpose: string | null
  status: ApplicationStatus
  assigned_to: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  profiles?: Profile
  assigned_user?: InternalUser | null
}

export interface LoanDocument {
  id: string
  application_id: string
  document_type: DocumentType
  file_url: string
  file_name: string
  uploaded_at: string
  status: DocumentStatus
  reject_reason: string | null
}

export interface StatusHistory {
  id: string
  application_id: string
  status: ApplicationStatus
  changed_by: string | null
  changed_at: string
  note: string | null
  internal_users?: InternalUser | null
}

export interface ApplicationComment {
  id: string
  application_id: string
  author_id: string
  content: string
  created_at: string
  internal_users?: InternalUser
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  kyc_verification: 'Vérification KYC',
  analysis: 'En analyse',
  additional_docs_required: 'Documents requis',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  disbursed: 'Décaissée',
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  id_front: "Pièce d'identité (recto)",
  id_back: "Pièce d'identité (verso)",
  selfie: 'Selfie',
  income_proof: 'Justificatif de revenu',
  address_proof: 'Justificatif de domicile',
  additional: 'Document complémentaire',
}

export const STANDARD_DOC_TYPES: DocumentType[] = [
  'id_front', 'id_back', 'selfie', 'income_proof', 'address_proof',
]

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  personal: 'Crédit personnel',
  auto: 'Crédit auto',
  mortgage: 'Crédit immobilier',
  business: 'Crédit professionnel',
  education: "Crédit études",
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  freelance: 'Freelance',
  retired: 'Retraité',
  other: 'Autre',
}
