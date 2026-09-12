export function LifeOSLogo({ className }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden ${className || ''}`.trim()}
      style={{
        borderRadius: '22%',
      }}
    >
      <img
        src="/Logo(croped).png"
        alt="LifeOS"
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
