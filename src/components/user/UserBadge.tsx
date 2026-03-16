type Level = 'bronze' | 'silver' | 'gold' | 'platinum'

interface UserBadgeProps {
  level: Level
}

const levelConfig: Record<Level, { label: string; className: string }> = {
  bronze: { label: 'Bronze', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  silver: { label: 'Silver', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  platinum: { label: 'Platinum', className: 'bg-blue-100 text-blue-700 border-blue-300' },
}

export default function UserBadge({ level }: UserBadgeProps) {
  const config = levelConfig[level] ?? levelConfig.bronze

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border ${config.className}`}
    >
      {config.label}
    </span>
  )
}
