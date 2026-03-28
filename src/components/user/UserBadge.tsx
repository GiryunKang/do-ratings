type Level = 'bronze' | 'silver' | 'gold' | 'platinum'

interface UserBadgeProps {
  level: Level
}

const levelConfig: Record<Level, { label: string; className: string; icon: string; shimmer?: boolean }> = {
  bronze: { label: 'Bronze', className: 'bg-amber-100 text-amber-700 border-amber-300', icon: '★' },
  silver: { label: 'Silver', className: 'bg-muted text-muted-foreground border-border', icon: '★' },
  gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '★', shimmer: true },
  platinum: { label: 'Platinum', className: 'bg-blue-100 text-blue-700 border-blue-300', icon: '★', shimmer: true },
}

export default function UserBadge({ level }: UserBadgeProps) {
  const config = levelConfig[level] ?? levelConfig.bronze

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.className} ${config.shimmer ? 'animate-shimmer' : ''}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  )
}
