import { useEffect, type RefObject } from "react";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Анимации лендинга внутри root:
 * - [data-reveal]   — появляется, когда попадает в экран (класс .is-visible);
 * - [data-progress] — получает CSS-переменную --progress (0…1) по мере прокрутки;
 * - [data-spotlight] — получает --mx/--my, подсветка следует за курсором.
 */
export const useLandingMotion = (rootRef: RefObject<HTMLElement | null>) => {
  // появление при прокрутке
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = root.querySelectorAll<HTMLElement>("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);

  // прогресс прокрутки для «выпрямления» картинок и раскрытия
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-progress]"));
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // 0 — верх элемента у нижнего края экрана, 1 — верх на 15% высоты экрана
        const progress = clamp((vh - rect.top) / (vh * 0.85), 0, 1);
        el.style.setProperty("--progress", progress.toFixed(4));
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [rootRef]);

  // подсветка карточек за курсором
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-spotlight]");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    return () => root.removeEventListener("pointermove", onMove);
  }, [rootRef]);
};
