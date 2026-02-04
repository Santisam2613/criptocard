"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  t: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function configFor(width: number) {
  const mobile = width < 640;
  const tablet = width < 1024;
  return {
    count: mobile ? 26 : tablet ? 38 : 52,
    maxDpr: mobile ? 1.5 : 2,
    linkDist: mobile ? 120 : 160,
    baseSpeed: mobile ? 0.22 : 0.26,
    gravity: mobile ? 42 : 52,
    friction: 0.982,
    maxV: mobile ? 1.25 : 1.55,
  };
}

export default function GravityStarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let w = 1;
    let h = 1;
    let dpr = 1;
    let cfg = configFor(window.innerWidth);
    let stars: Star[] = [];

    const attractor = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      cfg = configFor(window.innerWidth);
      dpr = clamp(window.devicePixelRatio || 1, 1, cfg.maxDpr);
      w = Math.max(1, window.innerWidth);
      h = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      attractor.x = w * 0.5;
      attractor.y = h * 0.5;
      attractor.tx = attractor.x;
      attractor.ty = attractor.y;

      const next: Star[] = [];
      for (let i = 0; i < cfg.count; i++) {
        const seed = (i + 1) * 104729;
        const rx = (seed % 1000) / 1000;
        const ry = ((seed * 7) % 1000) / 1000;
        const rt = ((seed * 13) % 1000) / 1000;
        const angle = rt * Math.PI * 2;
        next.push({
          x: rx * w,
          y: ry * h,
          vx: Math.cos(angle) * cfg.baseSpeed,
          vy: Math.sin(angle) * cfg.baseSpeed,
          r: 0.9 + ((seed * 3) % 1000) / 1000,
          t: rt,
        });
      }
      stars = next;
    };

    const onPointer = (x: number, y: number) => {
      attractor.tx = x;
      attractor.ty = y;
    };

    const onPointerMove = (e: PointerEvent) => onPointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onPointer(t.clientX, t.clientY);
    };
    const onPointerLeave = () => onPointer(w * 0.5, h * 0.5);

    const drawFrame = (ts: number) => {
      raf = window.requestAnimationFrame(drawFrame);

      const dark = isDark();
      const dotFill = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.36)";
      const lineBase = dark ? 0.34 : 0.22;
      const glow = dark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.16)";

      attractor.x += (attractor.tx - attractor.x) * 0.05;
      attractor.y += (attractor.ty - attractor.y) * 0.05;

      ctx.clearRect(0, 0, w, h);

      const wobbleX = Math.sin(ts * 0.00022) * 18;
      const wobbleY = Math.cos(ts * 0.00019) * 12;
      const ax0 = attractor.x + wobbleX;
      const ay0 = attractor.y + wobbleY;

      const soft = 1400;
      for (const s of stars) {
        const dx = ax0 - s.x;
        const dy = ay0 - s.y;
        const d2 = dx * dx + dy * dy + soft;
        const inv = 1 / Math.sqrt(d2);
        const ax = dx * inv * inv * cfg.gravity * 0.0012;
        const ay = dy * inv * inv * cfg.gravity * 0.0012;

        s.vx = (s.vx + ax) * cfg.friction;
        s.vy = (s.vy + ay) * cfg.friction;

        const v = Math.hypot(s.vx, s.vy);
        if (v > cfg.maxV) {
          const k = cfg.maxV / v;
          s.vx *= k;
          s.vy *= k;
        }

        s.x += s.vx;
        s.y += s.vy;

        if (s.x < -20) s.x = w + 20;
        if (s.x > w + 20) s.x = -20;
        if (s.y < -20) s.y = h + 20;
        if (s.y > h + 20) s.y = -20;
      }

      const linkDist2 = cfg.linkDist * cfg.linkDist;
      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDist2) continue;

          const d = Math.sqrt(d2);
          const t = 1 - d / cfg.linkDist;
          const phase = (a.t * 13 + b.t * 7) % 1;
          const flicker = 0.55 + 0.45 * Math.sin(ts * 0.0005 + phase * Math.PI * 2);
          const alpha = lineBase * t * flicker;
          if (alpha < 0.01) continue;

          ctx.strokeStyle = dark
            ? `rgba(255,255,255,${alpha})`
            : `rgba(0,0,0,${alpha})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = glow;
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = dotFill;
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const start = () => {
      resize();
      raf = window.requestAnimationFrame(drawFrame);
    };

    if (!reduced.matches) start();
    else resize();

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const onTheme = () => {};
    window.addEventListener("cc-theme-mode", onTheme as EventListener);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onTheme);
    const onReduced = () => {
      window.cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
      if (!reduced.matches) start();
      else resize();
    };
    reduced.addEventListener("change", onReduced);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("cc-theme-mode", onTheme as EventListener);
      mq.removeEventListener("change", onTheme);
      reduced.removeEventListener("change", onReduced);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full opacity-50" />
    </div>
  );
}
