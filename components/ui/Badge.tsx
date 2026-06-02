import { ApplicationStatus, STATUS_LABELS } from '@/lib/types'

type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange'

const variantClasses: Record<BadgeVariant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-700',
}

export function Badge({
  children,
  variant = 'gray',
  className = '',
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

const statusVariants: Record<ApplicationStatus, BadgeVariant> = {
  draft: 'gray',
  submitted: 'blue',
  kyc_verification: 'purple',
  analysis: 'yellow',
  additional_docs_required: 'orange',
  approved: 'green',
  rejected: 'red',
  disbursed: 'green',
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant={statusVariants[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function RoleBadge({ role }: { role: 'agent' | 'supervisor' | 'admin' }) {
  const labels = { agent: 'Agent', supervisor: 'Superviseur', admin: 'Administrateur' }
  const variants: Record<string, BadgeVariant> = { agent: 'blue', supervisor: 'purple', admin: 'red' }

  return <Badge variant={variants[role]}>{labels[role]}</Badge>
}
