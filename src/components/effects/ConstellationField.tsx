import { useEffect, useRef, useCallback } from 'react';

interface Props {
  density?: number;
  speed?: number;
  className?: string;
}

/**
 * Constellation Field with cursor interaction.
 * Particles drift and form connections, gently pushed away from cursor movement.
 * Based on the verified source from bg.md.
 */
export function ConstellationField({ density = 1, speed = 1, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: -1000, y: -1000 });
  const nodesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>>([]);
  const animationRef = useRef<number>();
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const LINK = 160;
  const BASE_MAX_NODES = 85;

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const initNodes = useCallback((width: number, height: number) => {
    const maxNodes = Math.floor(BASE_MAX_NODES * density);
    nodesRef.current = [];
    for (let i = 0; i < maxNodes; i++) {
      nodesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3 * speed,
        vy: (Math.random() - 0.5) * 0.3 * speed,
        radius: Math.random() * 2.4 + 1.8
      });
    }
  }, [density, speed]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensionsRef.current;
    const nodes = nodesRef.current;
    const pointer = pointerRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    // Draw Links first so nodes sit crisp on top
    ctx.strokeStyle = '#E6C879';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = dist(nodes[i], nodes[j]);
        if (d < LINK) {
          ctx.globalAlpha = 0.22 + (1 - d / LINK) * 0.55;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off edges
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      // Clamp position to prevent escaping
      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));

      // Gentle Pointer gravity - particles pushed away from cursor
      const pd = dist(node, pointer);
      if (pd < 220 && pd > 0) {
        const force = (220 - pd) / 220 * 0.008;
        node.x -= (node.x - pointer.x) / pd * force * pd;
        node.y -= (node.y - pointer.y) / pd * force * pd;
      }

      // Draw Node (Pale Gold) — core + soft halo so particles read at retina scale
      const pulse = 0.78 + Math.sin(Date.now() * 0.001 + node.x) * 0.22;
      ctx.fillStyle = '#E6C879';
      ctx.globalAlpha = pulse * 0.28;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      dimensionsRef.current = { width, height };
      initNodes(width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      pointerRef.current.x = -1000;
      pointerRef.current.y = -1000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointerRef.current.x = e.touches[0].clientX;
        pointerRef.current.y = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      pointerRef.current.x = -1000;
      pointerRef.current.y = -1000;
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
}
