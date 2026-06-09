import Image from "next/image";
import { productos, type Producto, type ProductoOpcion } from "@/data/productos";
import { getMergedProductsSync, fetchMergedProducts } from '@/utils/mergedProducts';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useCart } from "@/context/CartContext";
import { animateToCart } from "@/utils/animateToCart";
import ProductCard from "@/components/ProductCard";
import ProductQuickAddModal from "@/components/ProductQuickAddModal";
import { type FitMode } from "@/utils/constants";
import { formatCLP } from "@/utils/format";

interface ProductSectionProps {
  title: string;
  productIds: number[];
  linkBase: string;
}

export default function ProductSection({ title, productIds, linkBase }: ProductSectionProps) {
  const { addToCart } = useCart();

  const [mergedState, setMergedState] = useState<ReadonlyArray<Producto> | null>(() => getMergedProductsSync());
  const [seleccion, setSeleccion] = useState<Record<number, string>>({});
  const [fitMap, setFitMap] = useState<Record<number, FitMode>>({});
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await fetchMergedProducts();
        if (!mounted) return;
        setMergedState(m.length ? m : null);
      } catch {}
    })();

    const onChange = () => {
      // re-fetch merged products on admin events
      (async () => {
        try {
          const m = await fetchMergedProducts();
          if (!mounted) return;
          setMergedState(m.length ? m : null);
        } catch {}
      })();
    };

    window.addEventListener('product-overrides-changed', onChange as EventListener);
    window.addEventListener('storage', (e) => { if (e.key === 'product-overrides-updated') onChange(); });
    return () => { mounted = false; window.removeEventListener('product-overrides-changed', onChange as EventListener); };
  }, []);

  const merged = mergedState;
  const source = merged && merged.length ? merged : productos;
  const products: Producto[] = productIds
    .map((id) => source.find((p) => p.id === id))
    .filter((p): p is Producto => Boolean(p));

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport && activeProductId !== null) {
      setActiveProductId(null);
    }
  }, [isMobileViewport, activeProductId]);

  const addToCartWithSelection = useCallback(
    (prod: Producto, selId: string, e?: React.MouseEvent<HTMLElement>) => {
      if (prod.configuracion?.tipo === "armalo") {
        if (!selId || !selId.startsWith("armalo:")) {
          alert("Completa tu selección antes de agregar al carrito.");
          return;
        }

        let payloadRaw: unknown = null;
        try {
          payloadRaw = JSON.parse(selId.slice(7));
        } catch {
          alert("Hubo un problema con la selección. Intenta nuevamente.");
          return;
        }

        const isObject = (v: unknown): v is Record<string, unknown> =>
          typeof v === "object" && v !== null;

        const getStr = (o: unknown, key: string): string | undefined => {
          if (!isObject(o)) return undefined;
          const v = o[key];
          return typeof v === "string" ? v : undefined;
        };

        const getNum = (o: unknown, key: string): number | undefined => {
          if (!isObject(o)) return undefined;
          const v = o[key];
          return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
        };

        const maybePrice = getNum(payloadRaw, "price");
        const precioUnit = typeof maybePrice === "number" ? maybePrice : prod.valor;

        const norm = (s: unknown) =>
          String(s ?? "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const root = isObject(payloadRaw) ? payloadRaw : {};
        const selection = isObject((root as Record<string, unknown>).selection)
          ? ((root as Record<string, unknown>).selection as Record<string, unknown>)
          : undefined;

        const pick = (obj: Record<string, unknown> | undefined, keys: string[]) => {
          for (const k of keys) {
            const v = obj?.[k];
            if (typeof v === "string" || typeof v === "number") return v;
          }
          return undefined;
        };

        const parts = [
          pick(selection, ["proteina1"]) ?? pick(root as Record<string, unknown>, ["proteina1", "p1"]),
          pick(selection, ["proteina2"]) ?? pick(root as Record<string, unknown>, ["proteina2", "p2"]),
          pick(selection, ["acomp1"]) ?? pick(root as Record<string, unknown>, ["acomp1", "a1"]),
          pick(selection, ["acomp2"]) ?? pick(root as Record<string, unknown>, ["acomp2", "a2"]),
          pick(selection, ["envoltura"]) ?? pick(root as Record<string, unknown>, ["envoltura", "wrap"]),
        ].map(norm);

        const fnv1a = (str: string) => {
          let h = 0x811c9dc5;
          for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
          }
          return (h >>> 0).toString(16).padStart(8, "0");
        };

        const hasStructured = parts.some((x) => x.length > 0);

        const sortObject = (x: unknown): unknown => {
          if (Array.isArray(x)) return x.map(sortObject);
          if (isObject(x)) {
            return Object.keys(x)
              .sort()
              .reduce((acc: Record<string, unknown>, k) => {
                acc[k] = sortObject((x as Record<string, unknown>)[k]);
                return acc;
              }, {});
          }
          return x;
        };

        const signature = hasStructured
          ? parts.join("|")
          : `hash:${fnv1a(JSON.stringify(sortObject(payloadRaw)))}`;

        const armaloId = `armalo:${signature}`;
        const label = getStr(payloadRaw, "label") ?? "Ármalo a tu gusto";

        addToCart(prod, {
          opcion: { id: armaloId, label },
          precioUnit,
        });

        if (e) animateToCart(e.nativeEvent as unknown as MouseEvent);
        return;
      }

      let opt: ProductoOpcion | undefined;
      if (prod.opciones?.length) {
        opt = prod.opciones.find((o) => o.id === selId);
        if (!opt) {
          alert("Por favor, elige una opción antes de agregar al carrito.");
          return;
        }
      }

      const precioUnit = opt?.precio ?? prod.valor;
      addToCart(prod, {
        opcion: opt ? { id: opt.id, label: opt.label } : undefined,
        precioUnit,
      });
      if (e) animateToCart(e.nativeEvent as unknown as MouseEvent);
    },
    [addToCart]
  );

  const activeProduct = useMemo(
    () => (activeProductId == null ? null : products.find((p) => p.id === activeProductId) ?? null),
    [activeProductId, products]
  );

  return (
    <section className="py-12 text-gray-100">
      <div className="w-full max-w-none px-4 sm:px-10">
        <h2 className="text-2xl font-bold text-center mb-8">{title}</h2>

        {isMobileViewport ? (
          <div className="grid grid-cols-2 gap-px sm:gap-4">
            {products.map((p) => (
              <div key={p.id} className="h-full">
                <ProductCard
                  product={p}
                  selectedOptionId={seleccion[p.id] ?? ""}
                  onSelectOption={(id) => setSeleccion((prev) => ({ ...prev, [p.id]: id }))}
                  fitMode={fitMap[p.id] ?? "contain"}
                  onFitChange={(mode) =>
                    setFitMap((m) => (m[p.id] === mode ? m : { ...m, [p.id]: mode }))
                  }
                  onAdd={() => setActiveProductId(p.id)}
                  isAvailable={p.enabled ?? true}
                  showAddButton
                  showPrice
                  showInlineSelectors={false}
                  imageTapOpensAdd
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 justify-center items-stretch [grid-template-columns:repeat(auto-fit,minmax(240px,300px))] sm:[grid-template-columns:repeat(auto-fit,minmax(260px,320px))]">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-[#1a1a1a] rounded-lg overflow-hidden shadow flex flex-col h-full min-h-[480px]"
              >
                <div className="overflow-hidden bg-black h-72 sm:h-80">
                  <Image
                    src={p.imagen}
                    alt={p.nombre}
                    width={500}
                    height={300}
                    className="w-full h-full object-cover"
                    style={{
                      objectFit: (p.imageObjectFit as CSSProperties['objectFit']) ?? 'cover',
                      ...(p.imageObjectPosition ? { objectPosition: p.imageObjectPosition } : {}),
                    }}
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
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm">{p.nombre}</h3>
                  <p className="text-xs text-gray-300 line-clamp-2">{p.descripcion}</p>

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
        )}

        {isMobileViewport && (
          <ProductQuickAddModal
            open={activeProductId !== null}
            product={activeProduct}
            selectedOptionId={activeProduct ? (seleccion[activeProduct.id] ?? "") : ""}
            isAvailable={activeProduct ? (activeProduct.enabled ?? true) : false}
            onSelectOption={(id) => {
              if (!activeProduct) return;
              setSeleccion((prev) => ({ ...prev, [activeProduct.id]: id }));
            }}
            onClose={() => setActiveProductId(null)}
            onConfirm={(e) => {
              if (!activeProduct) return;
              const selectedId = seleccion[activeProduct.id] ?? "";
              addToCartWithSelection(activeProduct, selectedId, e);
              setActiveProductId(null);
            }}
          />
        )}
      </div>
    </section>
  );
}

