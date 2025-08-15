// src/utils/animateToCart.ts
export function animateToCart(evt: MouseEvent) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-anchor]"));
  if (!anchors.length) return;

  // elige la última ancla (normalmente el botón flotante si existe)
  const target = anchors[anchors.length - 1];
  const cartRect = target.getBoundingClientRect();

  const startX = evt.clientX;
  const startY = evt.clientY;

  const dot = document.createElement("div");
  dot.className = "fixed pointer-events-none w-3 h-3 rounded-full bg-red-500 z-[9999]";
  dot.style.left = `${startX}px`;
  dot.style.top = `${startY}px`;
  document.body.appendChild(dot);

  const deltaX = cartRect.left + cartRect.width / 2 - startX;
  const deltaY = cartRect.top + cartRect.height / 2 - startY;

  dot.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${deltaX * 0.7}px, ${deltaY * 0.7}px) scale(1.15)`, opacity: 0.9, offset: 0.7 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.2)`, opacity: 0.2 }
    ],
    { duration: 3000, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  ).onfinish = () => dot.remove();
}
