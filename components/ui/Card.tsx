import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, padding = 'md', className = '', ...props }: CardProps) {
  return (
    <div
      className={['rounded-xl border border-gray-200 bg-white shadow-sm', paddingClasses[padding], className].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={['mb-4 flex items-center justify-between', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={['text-lg font-semibold text-gray-900', className].join(' ')}>
      {children}
    </h3>
  )
}

export function StatCard({
  label,
  value,
  icon,
  color = 'blue',
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <Card padding="md">
      <div className="flex items-center gap-4">
        <div className={['flex h-12 w-12 items-center justify-center rounded-xl', colorClasses[color]].join(' ')}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  )
}
