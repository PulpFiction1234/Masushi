import { normalize } from "./strings";
import type { Producto } from "@/data/productos";

// Return true if the product matches ALL tokens according to the public page logic
export function matchesTokens(p: Producto, tokens: string[]) {
  if (tokens.length === 0) return true;

  const nombre = normalize(p.nombre);
  const desc = normalize(p.descripcion ?? "");
  const cod = normalize(p.codigo ?? "");
  const codSinCeros = cod.replace(/^0+/, "");

  return tokens.every((t) => {
    const tSinCeros = t.replace(/^0+/, "");
    return (
      nombre.includes(t) ||
      desc.includes(t) ||
      cod.includes(t) ||
      codSinCeros.includes(t) ||
      cod.includes(tSinCeros)
    );
  });
}

export default matchesTokens;
