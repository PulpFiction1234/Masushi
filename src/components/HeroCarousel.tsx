// src/components/HeroCarousel.tsx
"use client";

import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import hero1 from "@/public/images/hero-1.webp";
import hero2 from "@/public/images/hero-2.webp";
import hero3 from "@/public/images/hero-3.webp";

interface HeroCarouselProps {
  slides?: StaticImageData[];
  intervalMs?: number;
  heightClass?: string; // para ajustar altura si quieres␊
}

export default function HeroCarousel({
  slides = [hero2, hero1, hero3],
  intervalMs = 5000,
  heightClass = "h-[500px] md:h-[600px]",
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goTo = (i: number) => setIndex(i);

  useEffect(() => {
    if (paused) return;
    clear();
    timerRef.current = setTimeout(next, intervalMs);
    return clear;
  }, [index, paused, next, intervalMs]);

  return (
    <section
      className={`relative ${heightClass} overflow-hidden`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Slides como fondos */}
       <div className="absolute inset-0">
        {slides.map((src, i) => (
          <Image
            key={src.src}
            src={src}
            alt=""
            fill
            placeholder="blur"
            quality={60}
            className={`object-cover transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
            priority={i === 0}
          />
        ))}
        {/* Oscurecedor para legibilidad */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Contenido centrado (lo mismo que tenías) */}
      <div className="relative z-10 h-full bottom-15 flex items-end justify-center text-center px-4">
          <Link href="/menu" className="inline-block">
            <button className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded text-white font-semibold">
              Ver Carta
            </button>
          </Link>        
      </div>
      {/* Controles */}
      <button
        aria-label="Anterior"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 grid place-items-center"
      >
        ‹
      </button>
      <button
        aria-label="Siguiente"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 grid place-items-center"
      >
        ›
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir al slide ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/60 ${
              i === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
