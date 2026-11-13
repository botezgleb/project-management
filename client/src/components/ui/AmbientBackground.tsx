import { useEffect, useRef } from "react";

// Мягкое свечение на фоне всего сайта: несколько «пятен» медленно плавают
// по своим траекториям (CSS), а одно плавно следует за курсором (rAF + lerp).
export const AmbientBackground = () => {
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = cursorRef.current;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || !finePointer || reduceMotion) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 3;
    let x = targetX;
    let y = targetY;
    let raf = 0;

    const tick = () => {
      // плавное «догоняние» курсора
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

      if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      el.classList.add("is-active");
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => el.classList.remove("is-active");

    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="ambient" aria-hidden>
      <span className="ambient-orb orb-1" />
      <span className="ambient-orb orb-2" />
      <span className="ambient-orb orb-3" />
      <span className="ambient-orb orb-4" />
      <span className="ambient-orb orb-5" />
      <span className="ambient-cursor" ref={cursorRef} />
    </div>
  );
};
