'use client'

interface AchievementBadgeProps {
  icon: string
  name: string
  description: string
  earned?: boolean
}

export default function AchievementBadge({
  icon,
  name,
  description,
  earned = true,
}: AchievementBadgeProps) {
  return (
    <div className={`group relative inline-flex flex-col items-center gap-1 ${earned ? '' : 'opacity-40 grayscale'}`}>
      {/* Badge pill */}
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-xl border border-gray-200 cursor-default select-none">
        {icon}
      </span>

      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 hidden group-hover:flex flex-col items-center">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-max max-w-[180px] text-center shadow-lg">
          <p className="font-semibold leading-snug">{name}</p>
          <p className="text-gray-300 mt-0.5 leading-snug">{description}</p>
        </div>
        {/* Arrow */}
        <div className="border-[5px] border-transparent border-t-gray-900" />
      </div>
    </div>
  )
}
