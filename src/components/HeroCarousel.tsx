// src/components/HeroCarousel.tsx
"use client";

import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import heroCumpleanosDesktop from "@/public/images/hero-cumpleanos.webp";
import heroCumpleanosMobile from "@/public/images/hero-cumpleanos-celular.webp";
import heroNuevosDesktop from "@/public/images/hero-nuevos.webp";
import heroNuevosMobile from "@/public/images/hero-nuevos-celular.webp";
import heroSushiDayDesktop from "@/public/images/diadelsushicomputador.png";
import heroSushiDayMobile from "@/public/images/diadelsushicelular.png";

interface SlideData {
  desktop: StaticImageData;
  mobile: StaticImageData;
  href: string;
  label: string;
}

interface HeroCarouselProps {
  slides?: SlideData[];
  intervalMs?: number;
  heightClass?: string;
}

const defaultSlides: SlideData[] = [
  { desktop: heroCumpleanosDesktop, mobile: heroCumpleanosMobile, href: "/profile?openBirthday=1", label: "Registrar Cumpleaños" },
  { desktop: heroNuevosDesktop, mobile: heroNuevosMobile, href: "/menu", label: "Ver Carta" },
];

const SUSHI_DAY_PROMO_DATE = "2026-06-18";
const SUSHI_DAY_TIME_ZONE = "America/Santiago";

const getYmdInTimeZone = (reference: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);

const isSushiDayPromoActive = (reference: Date = new Date()): boolean =>
  getYmdInTimeZone(reference, SUSHI_DAY_TIME_ZONE) === SUSHI_DAY_PROMO_DATE;

export default function HeroCarousel({
  slides,
  intervalMs = 5000,
  heightClass = "w-full aspect-[1122/1402] md:aspect-[2079/756]",
}: HeroCarouselProps) {
  const slidesResolved = slides ?? (
    isSushiDayPromoActive()
      ? [
          {
            desktop: heroSushiDayDesktop,
            mobile: heroSushiDayMobile,
            href: "/menu",
            label: "Pedir Ahora",
          },
          ...defaultSlides,
        ]
      : defaultSlides
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);
  const wasDragged = useRef(false);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slidesResolved.length);
  }, [slidesResolved.length]);

  const prev = () => setIndex((i) => (i - 1 + slidesResolved.length) % slidesResolved.length);
  const goTo = (i: number) => setIndex(i);

  useEffect(() => {
    if (index >= slidesResolved.length) setIndex(0);
  }, [index, slidesResolved.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    wasDragged.current = false;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 50) {
      wasDragged.current = true;
      delta < 0 ? next() : prev();
    }
    dragStartX.current = null;
  };

  useEffect(() => {
    if (paused) return;
    clear();
    timerRef.current = setTimeout(next, intervalMs);
    return clear;
  }, [index, paused, next, intervalMs]);

  return (
    <div>
    <section
      className={`relative ${heightClass} overflow-hidden select-none cursor-grab active:cursor-grabbing`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); dragStartX.current = null; }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
    >
      {/* Slides como fondos */}
       <div className="absolute inset-0">
        {slidesResolved.map((slide, i) => (
          <Link key={i} href={slide.href} onClick={(e) => { if (wasDragged.current) e.preventDefault(); }} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`} aria-hidden={i !== index} tabIndex={i === index ? 0 : -1}>
            {/* Imagen móvil */}
            <Image
              src={slide.mobile}
              alt=""
              fill
              placeholder="blur"
              quality={60}
              className="object-cover md:hidden"
              priority={i === 0}
            />
            {/* Imagen desktop */}
            <Image
              src={slide.desktop}
              alt=""
              fill
              placeholder="blur"
              quality={60}
              className="object-cover hidden md:block"
              priority={i === 0}
            />
          </Link>
        ))}
        {/* Oscurecedor para legibilidad */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Contenido centrado - solo desktop */}
      <div className="hidden md:flex relative z-10 h-full bottom-15 items-end justify-center text-center px-4">
          <Link href={slidesResolved[index]?.href ?? "/menu"} className="inline-block">
            <button className="bg-[#D1933E] hover:bg-[#b87d34] px-8 py-3 rounded text-black font-bold tracking-wide shadow-lg transition-colors">
              {slidesResolved[index]?.label ?? "Ver Carta"}
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
        {slidesResolved.map((_, i) => (
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

    {/* Botón móvil - debajo de la imagen, solo en celular */}
    <div className="md:hidden flex justify-center py-4 bg-black">
      <Link href={slidesResolved[index]?.href ?? "/menu"} className="inline-block">
        <button className="bg-[#D1933E] hover:bg-[#b87d34] px-8 py-3 rounded text-black font-bold tracking-wide shadow-lg transition-colors">
          {slidesResolved[index]?.label ?? "Ver Carta"}
        </button>
      </Link>
    </div>
    </div>
  );
}

