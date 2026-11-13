import {
  MouseSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DropAnimation,
} from "@dnd-kit/core";

// плавный «раздвиг» соседних карточек, пока тащим
export const SORT_TRANSITION = {
  duration: 320,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
};

const DROP_DURATION = 360;

// приземление с лёгкой пружиной: оверлей летит в слот,
// а внутренний элемент одновременно «опускается» (scale/rotate → 0)
export const dropAnimation: DropAnimation = {
  duration: DROP_DURATION,
  easing: "cubic-bezier(0.32, 1.25, 0.6, 1)",
  sideEffects: (params) => {
    const cleanup = defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0" } },
    })(params);

    const inner = params.dragOverlay.node.firstElementChild;
    inner?.classList.add("is-dropping");

    return () => {
      inner?.classList.remove("is-dropping");
      cleanup?.();
    };
  },
};

// мышь — сразу после сдвига на пару пикселей (клик остаётся кликом),
// тач — после короткого удержания, чтобы не мешать скроллу
export const useBoardSensors = (distance = 6) =>
  useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
  );
