import { useRef, useEffect, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface StarPortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
}

export function StarPortalButton({ children, className, ...props }: StarPortalButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const btn = btnRef.current;
    if (!canvas || !btn) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1;

    interface StarParticle {
      x: number; y: number; z: number;
      vx: number; vy: number;
      size: number; life: number; maxLife: number;
      hue: number;
    }

    let particles: StarParticle[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = btn.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * Math.min(w, h) * 0.4;
        particles.push({
          x: w / 2 + Math.cos(angle) * radius,
          y: h / 2 + Math.sin(angle) * radius,
          z: Math.random(),
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2 + 0.5,
          life: 0,
          maxLife: 60 + Math.random() * 80,
          hue: Math.random() < 0.6 ? 185 : Math.random() < 0.5 ? 235 : 25,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles = particles.filter(p => p.life < p.maxLife);

      for (const p of particles) {
        p.x += p.vx * (1 + p.z);
        p.y += p.vy * (1 + p.z);
        p.life++;
        const t = p.life / p.maxLife;
        const alpha = Math.sin(t * Math.PI) * 0.8;
        const size = p.size * (1 + p.z * 0.5);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 60%, ${alpha})`);
        grad.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (particles.length < 30) spawn(3);
      if (!reducedMotion) rafRef.current = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else if (!reducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    resize();
    spawn(40);
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(btn);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      className={cn(
        'sp-btn group relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'h-11 px-6 rounded-xl font-semibold text-body',
        'transition-all duration-300 ease-out-quart hover:-translate-y-0.5 active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        className,
      )}
      {...props}
    >
      <canvas ref={canvasRef} className="sp-canvas absolute inset-0" />
      <span className="sp-bg" />
      <span className="sp-border" />
      <span className="relative z-10 inline-flex items-center gap-2 text-bg-elevated">
        {children}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </button>
  );
}
