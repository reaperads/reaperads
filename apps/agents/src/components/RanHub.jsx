// The ran hub character (headset + antenna), shared by the mesh node and
// the ran agent card. The inner drawing is identical in both places.
export function RanHubInner() {
  return (
    <>
      <circle cx="0" cy="4" r="29" fill="var(--panel)" stroke="var(--ink-dim)" strokeWidth="1.5" />
      <line x1="0" y1="-25" x2="0" y2="-42" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="0" cy="-47" r="4" fill="var(--warn)" />
      <path
        d="M -31 -8 A 32 32 0 0 1 31 -8"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="-35" y="-10" width="8" height="18" rx="3.5" fill="var(--accent)" />
      <rect x="27" y="-10" width="8" height="18" rx="3.5" fill="var(--accent)" />
      <path d="M 31 6 Q 31 21 15 21" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="13" cy="21" r="3" fill="var(--accent)" />
      <circle cx="-10" cy="2" r="3.6" fill="var(--accent)" />
      <circle cx="10" cy="2" r="3.6" fill="var(--accent)" />
      <path d="M -6 13 Q 0 17 6 13" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

// Antenna arc — present only in the mesh node, not in the card.
export function RanHubArc() {
  return (
    <path
      d="M -14 -38 A 15 15 0 0 1 -8 -49 M 8 -49 A 15 15 0 0 1 14 -38"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.7"
    />
  )
}

// Card version: standalone SVG with the background badge circle.
export default function RanHubCard() {
  return (
    <svg viewBox="-64 -64 128 128">
      <circle r="56" fill="var(--bg-raise)" stroke="var(--line)" strokeWidth="1.5" />
      <RanHubInner />
    </svg>
  )
}
