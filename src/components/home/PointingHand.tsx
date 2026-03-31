/* eslint-disable @next/next/no-img-element */

export default function PointingHand({ className }: { className?: string }) {
  return (
    <img
      src="/images/pointing-hand.png"
      alt="Pointing hand"
      className={className}
      style={{
        transform: 'rotate(-30deg)',
        imageRendering: 'auto',
      }}
      draggable={false}
      referrerPolicy="no-referrer"
    />
  )
}
