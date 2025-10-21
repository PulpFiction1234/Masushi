// src/utils/animateToFavorites.ts
export function animateToFavorites(evt: MouseEvent) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-fav-anchor]"));
  if (!anchors.length) return;

  // choose the last anchor
  const target = anchors[anchors.length - 1];
  const favRect = target.getBoundingClientRect();

  const startX = evt.clientX;
  const startY = evt.clientY;

  const dot = document.createElement("div");
  dot.className = "fixed pointer-events-none w-3 h-3 rounded-full bg-yellow-400 z-[9999]";
  dot.style.left = `${startX}px`;
  dot.style.top = `${startY}px`;
  document.body.appendChild(dot);

  const deltaX = favRect.left + favRect.width / 2 - startX;
  const deltaY = favRect.top + favRect.height / 2 - startY;

  dot.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${deltaX * 0.7}px, ${deltaY * 0.7}px) scale(1.15)`, opacity: 0.9, offset: 0.7 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`, opacity: 0.2 }
    ],
    { duration: 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  ).onfinish = () => dot.remove();
}
