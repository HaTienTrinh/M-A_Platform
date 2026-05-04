import Link from 'next/link'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-500 max-w-sm mb-6">{description}</p>
      {action && (
        <Link 
          href={action.href} 
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
