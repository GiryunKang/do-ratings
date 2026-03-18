export default function PointingHand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 280"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skin1" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#fdd9b5" />
          <stop offset="100%" stopColor="#f0b88a" />
        </linearGradient>
        <linearGradient id="skin2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5c9a0" />
          <stop offset="100%" stopColor="#e8a474" />
        </linearGradient>
        <linearGradient id="highlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe8d0" />
          <stop offset="100%" stopColor="#fdd9b5" stopOpacity="0" />
        </linearGradient>
        <filter id="fs">
          <feDropShadow dx="3" dy="5" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
        </filter>
      </defs>

      <g filter="url(#fs)">
        {/* ── INDEX FINGER pointing right ── */}
        <path d="M148 128 Q165 124 195 118 Q220 113 242 112 Q258 112 264 118 Q268 124 264 130 Q258 135 242 133 Q220 131 195 130 Q170 130 152 134 Z" fill="url(#skin1)" stroke="#dda06a" strokeWidth="1.2"/>
        <path d="M155 127 Q175 122 210 116 Q235 113 252 114" stroke="url(#highlight)" strokeWidth="4" strokeLinecap="round" opacity="0.45"/>
        {/* nail */}
        <ellipse cx="262" cy="122" rx="5.5" ry="4.5" fill="#fce4d0" stroke="#d9a07a" strokeWidth="0.7"/>
        {/* crease */}
        <path d="M200 120 Q200 125 200 129" stroke="#d09060" strokeWidth="0.7" opacity="0.35" strokeLinecap="round"/>

        {/* ── THUMB pointing up-left ── */}
        <path d="M108 130 Q104 118 98 100 Q94 85 92 72 Q90 60 94 54 Q100 48 106 52 Q112 58 112 72 Q112 88 112 105 Q112 118 110 130 Z" fill="url(#skin1)" stroke="#dda06a" strokeWidth="1.2"/>
        <path d="M102 122 Q100 108 98 90 Q96 76 96 64" stroke="url(#highlight)" strokeWidth="3.5" strokeLinecap="round" opacity="0.4"/>
        <ellipse cx="99" cy="55" rx="5" ry="4" fill="#fce4d0" stroke="#d9a07a" strokeWidth="0.7"/>

        {/* ── PALM ── */}
        <path d="M95 125 Q90 118 92 108 Q96 98 108 94 L148 110 Q155 118 155 132 Q152 148 142 158 Q130 168 115 166 Q100 162 94 150 Q90 140 95 125 Z" fill="url(#skin2)" stroke="#dda06a" strokeWidth="1.2"/>
        {/* palm shadow */}
        <path d="M105 125 Q112 118 130 115 Q140 118 145 128 Q142 142 132 152 Q120 160 108 155 Q98 148 100 135 Z" fill="#d4915a" opacity="0.12"/>

        {/* ── MIDDLE FINGER curled ── */}
        <path d="M148 134 Q158 136 164 142 Q168 150 164 156 Q158 160 150 157 Q144 152 142 145 Q141 139 148 134 Z" fill="url(#skin2)" stroke="#dda06a" strokeWidth="1"/>
        <path d="M155 138 Q160 140 162 144" stroke="#d09060" strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>

        {/* ── RING FINGER curled ── */}
        <path d="M140 148 Q150 152 154 158 Q156 166 150 170 Q144 172 138 168 Q134 162 134 155 Q135 150 140 148 Z" fill="url(#skin2)" stroke="#dda06a" strokeWidth="1"/>

        {/* ── PINKY curled ── */}
        <path d="M130 158 Q140 162 142 168 Q143 176 138 179 Q132 180 127 176 Q124 170 125 164 Q126 160 130 158 Z" fill="url(#skin2)" stroke="#dda06a" strokeWidth="1"/>

        {/* ── WRIST ── */}
        <path d="M94 150 Q88 165 84 185 Q82 200 86 210 L124 214 Q130 202 128 185 Q126 168 120 155" fill="url(#skin1)" stroke="#dda06a" strokeWidth="1.2"/>
        <path d="M92 175 Q100 172 115 174" stroke="#d09060" strokeWidth="0.8" opacity="0.25" strokeLinecap="round"/>

        {/* ── SLEEVE ── */}
        <path d="M80 205 Q78 195 82 188 L86 210 Q88 218 96 222 L116 222 Q126 218 128 210 L132 188 Q134 195 132 205 Q130 225 108 228 Q86 225 80 205 Z" fill="#4f46e5"/>
        <path d="M84 208 Q96 204 120 206" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </g>
    </svg>
  )
}
