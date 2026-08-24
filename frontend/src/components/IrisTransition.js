import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

// Cinematic circular iris transition (iris-close -> black -> iris-open).
// Reusable across SABRE scene changes via an imperative ref: irisRef.current.play({...}).
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const IrisTransition = forwardRef(function IrisTransition(_, ref) {
  const overlayRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const [active, setActive] = useState(false);

  const distance = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

  const maxRadiusFrom = (x, y) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return Math.max(
      distance(x, y, 0, 0),
      distance(x, y, w, 0),
      distance(x, y, 0, h),
      distance(x, y, w, h)
    );
  };

  // Paint a black overlay with a transparent circular hole (iris) plus a subtle cyan edge glow.
  const paint = (x, y, radius) => {
    const el = overlayRef.current;
    if (!el) return;
    const r = Math.max(radius, 0);
    el.style.background = `radial-gradient(circle at ${x}px ${y}px,
      rgba(0,0,0,0) ${Math.max(r - 1.5, 0)}px,
      rgba(0,229,255,0.35) ${r}px,
      rgba(0,229,255,0.10) ${r + 10}px,
      rgba(0,0,0,1) ${r + 2.5}px)`;
  };

  const animateRadius = (x, y, from, to, duration) =>
    new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const r = from + (to - from) * easeInOutCubic(t);
        paint(x, y, r);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    });

  useImperativeHandle(
    ref,
    () => ({
      // play({ x, y, onCovered }) — iris closes toward (x,y), fires onCovered when black, then opens from center.
      async play({ x, y, onCovered, closeDuration = 620, openDuration = 720, holdDuration = 100 } = {}) {
        if (runningRef.current) return;
        runningRef.current = true;
        const cx = x ?? window.innerWidth / 2;
        const cy = y ?? window.innerHeight / 2;
        const rMax = maxRadiusFrom(cx, cy);
        setActive(true);
        paint(cx, cy, rMax); // start fully open (no flash)

        await animateRadius(cx, cy, rMax, 0, closeDuration);

        // Fully covered: swap the underlying scene while the screen is black.
        const el = overlayRef.current;
        if (el) el.style.background = '#000';
        if (onCovered) onCovered();
        await new Promise((r) => setTimeout(r, holdDuration));

        // Reverse iris: expand from screen center to reveal the new scene.
        const ox = window.innerWidth / 2;
        const oy = window.innerHeight / 2;
        await animateRadius(ox, oy, 0, maxRadiusFrom(ox, oy), openDuration);

        setActive(false);
        runningRef.current = false;
      },
    }),
    []
  );

  return (
    <div
      ref={overlayRef}
      data-testid="iris-transition-overlay"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        willChange: 'background',
        pointerEvents: active ? 'auto' : 'none',
        opacity: active ? 1 : 0,
      }}
    />
  );
});

export default IrisTransition;
