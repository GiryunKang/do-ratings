export default function PointingHand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Modern flat illustration style pointing hand */}
      <defs>
        <linearGradient id="skinG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD5A8" />
          <stop offset="100%" stopColor="#F4B87E" />
        </linearGradient>
        <linearGradient id="darkG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0A868" />
          <stop offset="100%" stopColor="#E09050" />
        </linearGradient>
      </defs>

      {/* Drop shadow */}
      <g style={{ filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.2))' }}>

        {/* === WRIST + FOREARM === */}
        <rect x="52" y="150" width="50" height="50" rx="12" fill="url(#skinG)" />

        {/* === SLEEVE === */}
        <rect x="46" y="175" width="62" height="28" rx="8" fill="#4F46E5" />
        <rect x="46" y="175" width="62" height="10" rx="5" fill="#6366F1" opacity="0.6" />

        {/* === PALM === */}
        <rect x="48" y="90" width="58" height="65" rx="16" fill="url(#skinG)" />
        {/* Palm inner shadow */}
        <rect x="55" y="100" width="44" height="45" rx="12" fill="url(#darkG)" opacity="0.15" />

        {/* === CURLED FINGERS (middle, ring, pinky) === */}
        {/* Middle finger - curled */}
        <rect x="98" y="105" width="22" height="30" rx="11" fill="url(#skinG)" stroke="#E8A468" strokeWidth="1" />
        <rect x="108" y="100" width="18" height="22" rx="9" fill="url(#darkG)" opacity="0.2" />

        {/* Ring finger - curled */}
        <rect x="94" y="125" width="20" height="26" rx="10" fill="url(#skinG)" stroke="#E8A468" strokeWidth="1" />

        {/* Pinky - curled */}
        <rect x="88" y="140" width="18" height="22" rx="9" fill="url(#skinG)" stroke="#E8A468" strokeWidth="1" />

        {/* === INDEX FINGER — pointing RIGHT === */}
        <g>
          {/* Finger base (connects to palm) */}
          <rect x="95" y="85" width="28" height="26" rx="13" fill="url(#skinG)" />
          {/* Main finger shaft */}
          <rect x="110" y="80" width="55" height="22" rx="11" fill="url(#skinG)" stroke="#E8A468" strokeWidth="1" />
          {/* Fingertip */}
          <ellipse cx="165" cy="91" rx="11" ry="11" fill="url(#skinG)" stroke="#E8A468" strokeWidth="1" />
          {/* Nail */}
          <ellipse cx="170" cy="91" rx="6" ry="7" fill="#FFE8D4" stroke="#DDA878" strokeWidth="0.8" />
          {/* Highlight on finger */}
          <rect x="115" y="82" width="40" height="6" rx="3" fill="white" opacity="0.2" />
          {/* Joint crease */}
          <line x1="130" y1="83" x2="130" y2="99" stroke="#D49060" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />
        </g>

        {/* === THUMB — pointing UP === */}
        <g>
          {/* Thumb base */}
          <rect x="42" y="88" width="26" height="28" rx="13" fill="url(#skinG)" />
          {/* Main thumb shaft */}
          <rect x="48" y="35" width="22" height="60" rx="11" fill="url(#skinG)" stroke="#E8A468" strokeWidth="1" />
          {/* Thumb tip */}
          <ellipse cx="59" cy="36" rx="11" ry="11" fill="url(#skinG)" stroke="#E8A468" strokeWidth="1" />
          {/* Nail */}
          <ellipse cx="59" cy="31" rx="7" ry="6" fill="#FFE8D4" stroke="#DDA878" strokeWidth="0.8" />
          {/* Highlight */}
          <rect x="51" y="42" width="6" height="35" rx="3" fill="white" opacity="0.2" />
          {/* Joint crease */}
          <line x1="51" y1="70" x2="67" y2="70" stroke="#D49060" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />
        </g>

        {/* === KNUCKLE DETAILS === */}
        <line x1="60" y1="108" x2="92" y2="108" stroke="#D49060" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
        <line x1="62" y1="120" x2="90" y2="120" stroke="#D49060" strokeWidth="0.8" opacity="0.2" strokeLinecap="round" />
      </g>
    </svg>
  )
}
