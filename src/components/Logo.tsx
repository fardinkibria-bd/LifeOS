export function LifeOSLogo({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-bg-elevated font-bold shadow-glow-sm-primary ${className || ''}`}
    >
      L
    </div>
  );
}
