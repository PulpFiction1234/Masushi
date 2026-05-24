import Image from "next/image";
import { productos, type Producto } from "@/data/productos";
import { formatCLP } from "@/utils/format";
import { useCart } from "@/context/CartContext";
import { animateToCart } from "@/utils/animateToCart";
import { useEffect, useState } from 'react';

interface ProductSectionProps {
  title: string;
  productIds: number[];
  linkBase: string;
}

export default function ProductSectionPromo({ title, productIds, linkBase }: ProductSectionProps) {
  const { addToCart } = useCart();

  const [overridesMap, setOverridesMap] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/product-overrides-public');
        if (!r.ok) return;
        const j = await r.json();
        const map: Record<string, boolean> = {};
        (j.overrides || []).forEach((o: any) => { if (o && o.codigo) map[o.codigo] = !!o.enabled; });
        if (!mounted) return;
        setOverridesMap(map);
      } catch {}
    })();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'product-overrides-updated') {
        (async () => {
          try {
            const r = await fetch('/api/product-overrides-public');
            if (!r.ok) return;
            const j = await r.json();
            const map: Record<string, boolean> = {};
            (j.overrides || []).forEach((o: any) => { if (o && o.codigo) map[o.codigo] = !!o.enabled; });
            setOverridesMap(map);
          } catch {}
        })();
      }
    };

    const onEvent = () => {
      // same as storage handler
      (async () => {
        try {
          const r = await fetch('/api/product-overrides-public');
          if (!r.ok) return;
          const j = await r.json();
          const map: Record<string, boolean> = {};
          (j.overrides || []).forEach((o: any) => { if (o && o.codigo) map[o.codigo] = !!o.enabled; });
          setOverridesMap(map);
        } catch {}
      })();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('product-overrides-changed', onEvent as EventListener);
    return () => { mounted = false; window.removeEventListener('storage', onStorage); window.removeEventListener('product-overrides-changed', onEvent as EventListener); };
  }, []);

  const products: Producto[] = productIds
    .map((id) => productos.find((p) => p.id === id))
    .filter((p): p is Producto => Boolean(p));

  return (
    <section className="py-12 text-gray-100">
      <div className="w-full max-w-none px-10">
        <h2 className="text-2xl font-bold text-center mb-8">{title}</h2>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex-none w-[78vw] sm:w-[45vw] md:w-[32vw] lg:flex-1 lg:w-0 bg-[#1a1a1a] rounded-lg overflow-hidden shadow flex flex-col"
            >
              <div className={`relative w-full aspect-[4/3] ${p.imagen ? 'bg-black' : 'bg-white'}`}>
                {p.imagen && (
                <Image
                  src={p.imagen}
                  alt={p.nombre}
                  fill
                  className="object-contain"
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 32vw, (min-width: 640px) 45vw, 78vw"
                  quality={60}
                  placeholder={
                    typeof p.imagen === "string"
                      ? p.blurDataUrl
                        ? "blur"
                        : undefined
                      : "blur"
                  }
                  blurDataURL={typeof p.imagen === "string" ? p.blurDataUrl : undefined}
                />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-base">{p.nombre}</h3>
                <p className="text-xs text-gray-300 mt-1">{p.descripcion}</p>

                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="font-bold">{formatCLP(p.valor)}</span>

                  {p.configuracion?.tipo !== "armalo" ? (
                    p.enabled === false ? (
                      <button className="bg-[#2a2a2a] text-white px-3 py-1 rounded text-xs w-full cursor-not-allowed" disabled aria-disabled title="Sin stock">Sin stock</button>
                    ) : (
                      <button
                        onClick={(e) => {
                          addToCart(p);
                          animateToCart(e.nativeEvent as unknown as MouseEvent);
                        }}
                        className="bg-[#93C021] hover:bg-[#93C021] text-white px-3 py-1 rounded text-xs"
                      >
                        Agregar
                      </button>
                    )
                  ) : (
                    <a
                      href={`${linkBase}${p.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Personalizar
                    </a>
                  )}
                </div>

                <a
                  href={`${linkBase}${p.id}`}
                  className="text-blue-400 text-xs hover:underline mt-2 inline-block"
                >
                  Ver en menú
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

