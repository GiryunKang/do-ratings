export default function PointingHand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 240"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylized cartoon hand: index pointing right, thumb up, others curled */}
      <defs>
        <linearGradient id="skinBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffcda8" />
          <stop offset="60%" stopColor="#f5b48a" />
          <stop offset="100%" stopColor="#e89b6e" />
        </linearGradient>
        <linearGradient id="skinLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe0c4" />
          <stop offset="100%" stopColor="#ffd1aa" />
        </linearGradient>
        <linearGradient id="skinDark" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4845a" />
          <stop offset="100%" stopColor="#c07548" />
        </linearGradient>
        <filter id="softShadow">
          <feDropShadow dx="4" dy="6" stdDeviation="8" floodColor="rgba(0,0,0,0.3)" />
        </filter>
      </defs>

      <g filter="url(#softShadow)">
        {/* === THUMB — pointing up === */}
        <path
          d="M95 130 C90 115, 85 95, 82 75 C80 60, 78 45, 82 35 C86 28, 94 26, 100 30 C106 34, 106 48, 105 62 C104 78, 102 98, 100 118"
          fill="url(#skinBase)"
          stroke="#d4885c"
          strokeWidth="1.5"
        />
        {/* Thumb highlight */}
        <path
          d="M90 120 C88 105, 85 85, 84 68 C83 55, 84 42, 87 35"
          stroke="url(#skinLight)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Thumb nail */}
        <path
          d="M86 36 C88 30, 96 28, 98 32 C100 36, 96 40, 90 40 C87 40, 85 38, 86 36Z"
          fill="#f8dcc8"
          stroke="#d4a080"
          strokeWidth="0.8"
        />

        {/* === INDEX FINGER — pointing right === */}
        <path
          d="M130 120 C150 118, 175 114, 200 110 C212 108, 225 106, 235 108 C242 110, 244 116, 240 120 C236 124, 224 124, 212 122 C195 120, 170 122, 145 126 L130 128Z"
          fill="url(#skinBase)"
          stroke="#d4885c"
          strokeWidth="1.5"
        />
        {/* Index finger top highlight */}
        <path
          d="M135 120 C155 117, 180 113, 205 110 C218 108, 230 108, 236 110"
          stroke="url(#skinLight)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Index fingernail */}
        <path
          d="M235 110 C238 108, 242 112, 242 116 C242 120, 238 122, 235 120 C232 118, 232 112, 235 110Z"
          fill="#f8dcc8"
          stroke="#d4a080"
          strokeWidth="0.8"
        />
        {/* Index finger knuckle crease */}
        <path d="M170 116 C170 120, 170 124, 170 126" stroke="#c88060" strokeWidth="1" opacity="0.4" strokeLinecap="round" />

        {/* === PALM — main body === */}
        <path
          d="M80 125 C78 118, 82 110, 95 108 L130 115 L135 130 L130 155 C125 165, 110 170, 95 168 C82 166, 76 155, 76 145 C76 138, 78 130, 80 125Z"
          fill="url(#skinBase)"
          stroke="#d4885c"
          strokeWidth="1.5"
        />
        {/* Palm center shadow */}
        <path
          d="M90 125 C95 120, 110 118, 125 122 C120 135, 115 150, 105 158 C95 162, 86 155, 84 145 C82 138, 86 130, 90 125Z"
          fill="url(#skinDark)"
          opacity="0.2"
        />

        {/* === MIDDLE FINGER — curled into fist === */}
        <path
          d="M130 130 C140 132, 148 136, 150 142 C152 150, 146 156, 138 155 C132 154, 126 148, 125 142 C124 138, 126 134, 130 130Z"
          fill="url(#skinBase)"
          stroke="#d4885c"
          strokeWidth="1.2"
        />
        {/* Middle finger knuckle */}
        <ellipse cx="140" cy="137" rx="6" ry="4" fill="url(#skinDark)" opacity="0.15" />

        {/* === RING FINGER — curled === */}
        <path
          d="M125 140 C134 144, 140 150, 140 157 C140 164, 134 168, 127 166 C121 164, 118 158, 118 152 C118 147, 120 143, 125 140Z"
          fill="url(#skinBase)"
          stroke="#d4885c"
          strokeWidth="1.2"
        />
        {/* Ring finger knuckle */}
        <ellipse cx="132" cy="148" rx="5" ry="3.5" fill="url(#skinDark)" opacity="0.15" />

        {/* === PINKY — curled === */}
        <path
          d="M118 152 C126 156, 130 162, 128 168 C126 174, 120 176, 114 174 C108 172, 106 166, 108 160 C110 156, 114 153, 118 152Z"
          fill="url(#skinBase)"
          stroke="#d4885c"
          strokeWidth="1.2"
        />
        {/* Pinky knuckle */}
        <ellipse cx="124" cy="160" rx="4" ry="3" fill="url(#skinDark)" opacity="0.15" />

        {/* === WRIST === */}
        <path
          d="M76 145 C72 160, 68 180, 66 200 C65 210, 68 218, 78 220 L110 222 C120 220, 124 212, 122 200 C120 185, 116 168, 110 155"
          fill="url(#skinBase)"
          stroke="#d4885c"
          strokeWidth="1.5"
        />

        {/* Wrist crease */}
        <path d="M78 170 C88 168, 100 167, 112 170" stroke="#c88060" strokeWidth="1" opacity="0.3" strokeLinecap="round" />

        {/* === SLEEVE/CUFF === */}
        <path
          d="M62 198 C60 205, 62 215, 70 222 L78 224 L116 224 C124 220, 128 212, 126 202 C125 198, 122 196, 118 198 C115 200, 112 210, 105 216 L85 218 C78 215, 72 208, 70 200 C68 196, 64 196, 62 198Z"
          fill="#4f46e5"
        />
        <path
          d="M64 204 C68 200, 74 198, 80 200"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  )
}
