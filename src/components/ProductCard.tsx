import React from "react";
import Image from "next/image";
import { type Producto } from "@/data/productos";
import ProductOptionSelector from "./ProductOptionSelector";
import BuildYourRollSelector from "./BuildYourRollSelector"; // ⬅️ NUEVO
import { fmtMiles } from "@/utils/format";
import { WIDE_THRESHOLD, type FitMode } from "@/utils/constants";
import { useUserProfile } from "@/context/UserContext";
import { useUser } from "@supabase/auth-helpers-react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
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
  adminControls?: React.ReactNode;
}

const ProductCard: React.FC<Props> = ({
  product,
  selectedOptionId,
  onSelectOption,
  onAdd,
  fitMode = "cover",
  onFitChange,
  isAvailable = true,
  showAddButton = true,
  showPrice = true,
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

  const disabled =
    esArmalo ? !armalo?.valid : (tieneOpciones && !selectedOptionId);

  // global override: if admin disabled this product, treat as out of stock
  const { map: overrides } = useProductOverrides();
  const globallyDisabled = !isAvailable || overrides[product.codigo ?? String(product.id)] === false;

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
    <div className="bg-gray-900 rounded-lg shadow p-4 flex flex-col h-full">
      <div className="relative aspect-square w-full overflow-hidden rounded bg-white">
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
          onLoadingComplete={(img) => {
            const ratio = img.naturalWidth / img.naturalHeight;
            const newMode: FitMode = ratio >= WIDE_THRESHOLD ? "contain" : "cover";
            if (newMode !== fitMode) onFitChange(newMode);
          }}
        />
        {/* ID del producto en la esquina superior derecha */}
        {product.codigo && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-base font-bold px-2 py-1 rounded">
            {product.codigo}
          </div>
        )}
        {/* Botón de favorito en la esquina superior izquierda */}
        {user && (
          <button
            onClick={toggleFavorite}
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            {isFav ? (
              <FaHeart className="text-red-500 text-xl" aria-hidden="true" />
            ) : (
              <FaRegHeart className="text-white text-xl" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <h3 className="text-lg text-gray-200 font-semibold mt-2">{product.nombre}</h3>
      <p className="text-sm text-gray-400">{product.descripcion}</p>

      {!esArmalo && tieneOpciones && (
        <ProductOptionSelector
          productId={product.id}
          opciones={product.opciones!}
          selectedId={selectedOptionId}
          onSelect={onSelectOption}
          precioBase={product.valor}
        />
      )}

      {esArmalo && product.configuracion && (
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
          <p className="font-bold text-gray-200 mt-3">
            {"$"}
            {fmtMiles.format(precioMostrar)}
          </p>
        )}

        {showAddButton && (
          <button
            type="button"
            onClick={onAdd}
            className={`${globallyDisabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 mt-3 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={disabled || globallyDisabled}
            aria-disabled={disabled || globallyDisabled}
          >
            {globallyDisabled ? 'Sin stock' : 'Agregar al carrito'}
          </button>
        )}
        
        {adminControls && <div className="mt-2">{adminControls}</div>}
      </div>
    </div>
  );
};

export default React.memo(ProductCard);

