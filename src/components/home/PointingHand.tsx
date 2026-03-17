export default function PointingHand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Realistic pointing hand — index finger extended to upper-right, thumb up, other fingers curled */}
      <defs>
        <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4c28d" />
          <stop offset="50%" stopColor="#e8a96e" />
          <stop offset="100%" stopColor="#d4915a" />
        </linearGradient>
        <linearGradient id="skinShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4915a" />
          <stop offset="100%" stopColor="#b87a4a" />
        </linearGradient>
        <filter id="handShadow">
          <feDropShadow dx="3" dy="5" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>

      <g filter="url(#handShadow)" transform="rotate(-25, 100, 120)">
        {/* Palm */}
        <path
          d="M75 145 C60 140, 50 125, 52 108 C54 95, 60 88, 68 82 L90 80 L110 82 C118 86, 124 95, 125 108 C126 120, 122 135, 115 145 Z"
          fill="url(#skin)"
        />
        {/* Palm shadow/depth */}
        <path
          d="M80 140 C68 136, 58 124, 60 110 C62 100, 66 92, 72 86 L88 84 L95 86 C90 95, 85 110, 82 130 Z"
          fill="url(#skinShadow)"
          opacity="0.3"
        />

        {/* Index finger — extended, pointing upper-right */}
        <path
          d="M110 82 C114 74, 120 60, 128 42 C132 34, 138 26, 142 20 C146 14, 152 12, 156 16 C160 20, 158 28, 154 36 C148 50, 140 64, 134 76 L125 84 Z"
          fill="url(#skin)"
        />
        {/* Index finger highlight */}
        <path
          d="M116 76 C120 66, 126 52, 132 38 C136 30, 140 24, 144 20"
          stroke="#f8d4a8"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Fingernail */}
        <ellipse cx="149" cy="16" rx="5" ry="4" fill="#f0d0b0" stroke="#d4a882" strokeWidth="0.5" />

        {/* Thumb — extended upward/outward */}
        <path
          d="M68 82 C62 74, 54 62, 48 52 C44 46, 42 40, 46 36 C50 32, 56 36, 60 42 C66 52, 70 64, 74 76 Z"
          fill="url(#skin)"
        />
        {/* Thumb highlight */}
        <path
          d="M64 76 C60 66, 54 54, 50 46"
          stroke="#f8d4a8"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Middle finger — curled */}
        <path
          d="M115 145 C120 140, 128 132, 132 126 C136 120, 134 116, 130 118 C126 120, 122 128, 118 136 Z"
          fill="url(#skinShadow)"
        />

        {/* Ring finger — curled */}
        <path
          d="M105 148 C112 146, 120 140, 124 134 C128 128, 126 124, 122 126 C118 128, 112 138, 108 144 Z"
          fill="url(#skinShadow)"
        />

        {/* Pinky — curled */}
        <path
          d="M95 150 C102 150, 110 146, 114 140 C118 134, 116 130, 112 132 C108 134, 102 142, 98 148 Z"
          fill="url(#skinShadow)"
        />

        {/* Knuckle lines */}
        <path d="M78 108 C85 106, 95 106, 108 108" stroke="#c88a60" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
        <path d="M80 118 C88 116, 98 116, 110 118" stroke="#c88a60" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />

        {/* Wrist */}
        <path
          d="M75 145 C72 155, 70 168, 72 180 L118 180 C120 168, 118 155, 115 145"
          fill="url(#skin)"
        />
        {/* Wrist crease */}
        <path d="M78 152 C88 150, 105 150, 112 152" stroke="#c88a60" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />

        {/* Sleeve cuff hint */}
        <path
          d="M68 175 C68 170, 72 168, 72 180 L118 180 C118 168, 122 170, 122 175 C122 182, 118 185, 95 185 C72 185, 68 182, 68 175 Z"
          fill="#4338ca"
          opacity="0.9"
        />
        <path
          d="M70 178 C80 176, 110 176, 120 178"
          stroke="#5b52d4"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  )
}
