export function LifeOSLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="LifeOS">
      <defs>
        <linearGradient id="lifeos-gold" x1="8" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1D889" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#9A7418" />
        </linearGradient>
      </defs>
      <path d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z" fill="none" stroke="url(#lifeos-gold)" strokeWidth="1.5" opacity=".8" />
      <path d="M16 13v22h17" fill="none" stroke="url(#lifeos-gold)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35" cy="35" r="2.25" fill="#FAFAFA" />
    </svg>
  );
}
