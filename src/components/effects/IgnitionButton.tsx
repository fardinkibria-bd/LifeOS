import { useRef, useEffect, useCallback, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface IgnitionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
}

/**
 * Ignition Button with WebGL star portal effect.
 * Based on the verified source from getstartedbtn.md.
 * Dark button with shimmering star field that reacts to hover and click.
 */
export function IgnitionButton({ children, className, ...props }: IgnitionButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);
  const warpRef = useRef(0);
  const warpTargetRef = useRef(0);
  const flashRef = useRef(0);
  const timeRef = useRef(0);
  const lastRef = useRef(performance.now());

  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('shader compile failed:', gl.getShaderInfoLog(s));
    }
    return s;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const btn = btnRef.current;
    if (!canvas || !btn) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FS = [
      'precision highp float;',
      'uniform vec2 u_res;',
      'uniform float u_time;',
      'uniform float u_warp;',
      'uniform float u_flash;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
      'float noise(vec2 p){',
      '  vec2 i=floor(p), f=fract(p);',
      '  vec2 u=f*f*(3.0-2.0*f);',
      '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
      '             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);',
      '}',
      'float fbm(vec2 p){',
      '  float v=0.0; float a=0.5;',
      '  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.07+vec2(13.1,5.7); a*=0.5; }',
      '  return v;',
      '}',
      'void main(){',
      '  vec2 sc = gl_FragCoord.xy / u_res;',
      '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',
      '  float r = length(uv);',
      '  float rr = max(r, 0.08);',
      '  float a = atan(uv.y, uv.x);',
      '  float t = u_time;',
      '  vec3 col = vec3(0.012, 0.011, 0.014);',
      '  float hz = fbm(uv * 2.6 + vec2(t * 0.35, 1.7));',
      '  col += vec3(0.13, 0.06, 0.032) * hz * (0.7 + 0.6 * u_warp);',
      '  for (int i = 0; i < 3; i++) {',
      '    float fi = float(i);',
      '    float ringN = 26.0 + fi * 9.0;',
      '    vec2 sp = vec2((a / 6.28318 + 0.5) * ringN,',
      '                   (0.3 + fi * 0.22) / rr + t * (2.0 + fi * 1.2));',
      '    vec2 cell = floor(sp);',
      '    vec2 f = fract(sp);',
      '    float h = hash(cell + fi * 17.31);',
      '    float on = step(0.68, h);',
      '    vec2 c = vec2(0.2 + 0.6 * hash(cell + 4.7), 0.5);',
      '    vec2 dlt = f - c;',
      '    float sy = mix(130.0, 8.0, u_warp);',
      '    float star = on * exp(-(dlt.x * dlt.x * 150.0 + dlt.y * dlt.y * sy));',
      '    float tw = 0.7 + 0.3 * sin(h * 81.0 + t * 9.0);',
      '    tw = mix(tw, 1.0, u_warp);',
      '    vec3 sCol = mix(vec3(1.0, 0.94, 0.85), vec3(1.0, 0.6, 0.33), step(0.9, h));',
      '    float fade = smoothstep(0.02, 0.25, r);',
      '    col += sCol * star * tw * fade * (1.1 + 0.7 * u_warp);',
      '  }',
      '  col += vec3(1.0, 0.8, 0.58) * u_warp * 0.32 * exp(-r * 4.0);',
      '  vec2 e = sc * (1.0 - sc);',
      '  col *= 0.3 + 0.7 * pow(e.x * e.y * 16.0, 0.3);',
      '  col = mix(col, vec3(1.0, 0.97, 0.92), clamp(u_flash, 0.0, 1.0));',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    const prog = gl.createProgram();
    if (!prog) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VS);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const locP = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(locP);
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uWarp = gl.getUniformLocation(prog, 'u_warp');
    const uFlash = gl.getUniformLocation(prog, 'u_flash');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const handleMouseEnter = () => { warpTargetRef.current = 1; };
    const handleMouseLeave = () => { warpTargetRef.current = 0; };
    const handleFocus = () => { warpTargetRef.current = 1; };
    const handleBlur = () => { warpTargetRef.current = 0; };
    const handleClick = () => {
      flashRef.current = 1;
      warpRef.current = 0;
      timeRef.current = 0;
    };

    btn.addEventListener('mouseenter', handleMouseEnter);
    btn.addEventListener('mouseleave', handleMouseLeave);
    btn.addEventListener('focus', handleFocus);
    btn.addEventListener('blur', handleBlur);
    btn.addEventListener('click', handleClick);

    window.addEventListener('resize', resize);
    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      warpRef.current += (warpTargetRef.current - warpRef.current) * Math.min(1, dt * 2.6);
      flashRef.current *= Math.exp(-4.5 * dt);
      timeRef.current += dt * (0.05 + warpRef.current * 1.35);
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 4.0 : timeRef.current);
      gl.uniform1f(uWarp, warpRef.current);
      gl.uniform1f(uFlash, flashRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      btn.removeEventListener('mouseenter', handleMouseEnter);
      btn.removeEventListener('mouseleave', handleMouseLeave);
      btn.removeEventListener('focus', handleFocus);
      btn.removeEventListener('blur', handleBlur);
      btn.removeEventListener('click', handleClick);
    };
  }, [compileShader]);

  return (
    <button
      ref={btnRef}
      className={cn(
        'ignition-btn group relative inline-flex items-center justify-center overflow-hidden',
        'h-12 px-6 rounded-3xl font-semibold text-sm',
        'transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'bg-[linear-gradient(180deg,#3c3f46_0%,#15171b_55%,#2a2d33_100%)]',
        'shadow-[0_26px_52px_rgba(15,12,10,.35),0_3px_10px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.14)]',
        'hover:shadow-[0_32px_64px_rgba(160,60,12,.3),0_4px_12px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.16)]',
        className,
      )}
      {...props}
    >
      <span className="absolute inset-[2px] rounded-[17px] overflow-hidden bg-[#06050a] shadow-[inset_0_2px_8px_rgba(0,0,0,.9)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" aria-hidden="true" />
      </span>
      <span className="relative z-10 pointer-events-none inline-flex items-center gap-2 font-medium tracking-[0.1em] text-[#fdf6ee]" style={{ textShadow: '0 0 14px rgba(255, 170, 100, .55), 0 1px 6px rgba(0, 0, 0, .9)' }}>
        {children}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </button>
  );
}
