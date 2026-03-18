'use client'

interface ShimmerTextProps {
  children: React.ReactNode
  className?: string
}

export default function ShimmerText({ children, className = '' }: ShimmerTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: 'linear-gradient(110deg, var(--primary) 35%, #c4b5fd 50%, var(--primary) 65%)',
        backgroundSize: '200% 100%',
        animation: 'shimmerText 3s linear infinite',
      }}
    >
      {children}
    </span>
  )
}
