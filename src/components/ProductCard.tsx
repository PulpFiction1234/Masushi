import React from "react";
import Image from "next/image";
import { type Producto } from "@/data/productos";
import ProductOptionSelector from "./ProductOptionSelector";
import BuildYourRollSelector from "./BuildYourRollSelector"; // ⬅️ NUEVO
import { fmtMiles } from "@/utils/format";
import { type FitMode } from "@/utils/constants";
import { useUserProfile } from "@/context/UserContext";
import { useUser } from "@supabase/auth-helpers-react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { TbShoppingBagPlus } from "react-icons/tb";
import useProductOverrides from '@/hooks/useProductOverrides';

function parseArmalo(encoded?: string) {
  if (!encoded || !encoded.startsWith("armalo:")) return null;
  try { return JSON.parse(encoded.slice(7)); } catch { return null; }
}

interface Props {
  product: Producto;
  selectedOptionId: string;
  onSelectOption(id: string): void;
  onAdd(e: React.MouseEvent<HTMLButtonElement>): void;
  fitMode?: FitMode;
  onFitChange(mode: FitMode): void;
  isAvailable?: boolean;
  showAddButton?: boolean;
  showPrice?: boolean;
  showInlineSelectors?: boolean;
  addButtonLabel?: string;
  adminControls?: React.ReactNode;
}

const ProductCard: React.FC<Props> = ({
  product,
  selectedOptionId,
  onSelectOption,
  onAdd,
  fitMode = "contain",
  onFitChange,
  isAvailable = true,
  showAddButton = true,
  showPrice = true,
  showInlineSelectors = true,
  addButtonLabel,
  adminControls,
}) => {
  const user = useUser();
  const { isFavorite, addFavorite, removeFavorite } = useUserProfile();
  
  const tieneOpciones = !!product.opciones?.length;
  const esArmalo = product.configuracion?.tipo === "armalo";
  const armalo = esArmalo ? parseArmalo(selectedOptionId) : null;

  const objectFitClass = fitMode === "contain" ? "object-contain" : "object-cover";

  const precioMostrar = esArmalo
    ? (armalo?.price ?? product.valor)
    : tieneOpciones
      ? (() => {
          const optSel = product.opciones!.find((o) => o.id === selectedOptionId);
          return (optSel?.precio ?? product.valor) || 0;
        })()
      : product.valor;

  // global override: if admin disabled this product, treat as out of stock
  const { map: overrides } = useProductOverrides();
  const globallyDisabled = !isAvailable || overrides[product.codigo ?? String(product.id)] === false;
  const selectionBlocked = showInlineSelectors && (esArmalo ? !armalo?.valid : (tieneOpciones && !selectedOptionId));

  const productCode = product.codigo || String(product.id);
  const isFav = user ? isFavorite(productCode) : false;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("Inicia sesión para guardar favoritos");
      return;
    }
    
    if (isFav) {
      await removeFavorite(productCode);
    } else {
      await addFavorite(productCode);
    }
  };

  return (
    <div className="bg-[#111111] rounded-lg shadow p-2.5 md:p-4 flex flex-col h-full border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors">
      <div className={`relative aspect-[4/3] md:aspect-square w-full overflow-hidden rounded ${product.imagen ? 'bg-black' : 'bg-white'}`}>
        {product.imagen && (
        <Image
          src={product.imagen}
          alt={product.nombre}
          fill
          sizes="(min-width:2000px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          className={objectFitClass}
          priority={false}
          quality={60}
          placeholder={
            typeof product.imagen === "string"
              ? product.blurDataUrl
                ? "blur"
                : undefined
              : "blur"
          }
          blurDataURL={
            typeof product.imagen === "string" ? product.blurDataUrl : undefined
          }
        />
        )}
        {/* ID del producto en la esquina superior derecha */}
        {product.codigo && (
          <div className="absolute top-2 right-2 bg-[#93C021] text-black text-[11px] md:text-base font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded">
            {product.codigo}
          </div>
        )}
        {/* Botón de favorito en la esquina superior izquierda */}
        {user && (
          <button
            onClick={toggleFavorite}
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white p-1.5 md:p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            {isFav ? (
              <FaHeart className="text-red-500 text-base md:text-xl" aria-hidden="true" />
            ) : (
              <FaRegHeart className="text-white text-base md:text-xl" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <h3 className="text-base md:text-lg text-white font-semibold mt-1.5 md:mt-2 leading-tight h-[3.6rem] md:h-auto line-clamp-3 md:line-clamp-none">{product.nombre}</h3>
      <p className="hidden md:block text-sm text-gray-400 leading-snug line-clamp-3">{product.descripcion}</p>

      {showInlineSelectors && !esArmalo && tieneOpciones && (
        <ProductOptionSelector
          productId={product.id}
          opciones={product.opciones!}
          selectedId={selectedOptionId}
          onSelect={onSelectOption}
          precioBase={product.valor}
        />
      )}

      {showInlineSelectors && esArmalo && product.configuracion && (
        <BuildYourRollSelector
          productId={product.id}
          config={product.configuracion}
          precioBase={product.valor}
          selectedId={selectedOptionId}
          onChange={onSelectOption}
        />
      )}

      <div className="mt-auto">
        {showPrice && (
          <p className="hidden md:block font-bold text-[#D1933E] mt-2 md:mt-3 text-base md:text-lg">
            {"$"}
            {fmtMiles.format(precioMostrar)}
          </p>
        )}

        {showAddButton && (
          <>
            <div className="md:hidden mt-2 flex items-center justify-between gap-2">
              {showPrice && (
                <p className="font-bold text-[#D1933E] text-base">
                  {"$"}
                  {fmtMiles.format(precioMostrar)}
                </p>
              )}
              {globallyDisabled ? (
                <span className="text-xs font-semibold text-gray-500">Sin stock</span>
              ) : (
                <button
                  type="button"
                  onClick={onAdd}
                  className="w-10 h-10 rounded-full bg-[#93C021] text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectionBlocked || globallyDisabled}
                  aria-disabled={selectionBlocked || globallyDisabled}
                  aria-label="Agregar al carrito"
                >
                  <TbShoppingBagPlus className="text-xl" aria-hidden="true" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onAdd}
              className={`${globallyDisabled ? 'bg-[#333] cursor-not-allowed text-gray-500' : 'bg-[#93C021] hover:bg-[#7fa01c] text-black font-semibold'} hidden md:block px-4 py-2 mt-3 rounded-md w-full text-base leading-tight disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              disabled={selectionBlocked || globallyDisabled}
              aria-disabled={selectionBlocked || globallyDisabled}
            >
              {globallyDisabled ? 'Sin stock' : (addButtonLabel ?? 'Agregar al carrito')}
            </button>
          </>
        )}
        
        {adminControls && <div className="mt-2">{adminControls}</div>}
      </div>
    </div>
  );
};

export default React.memo(ProductCard);

