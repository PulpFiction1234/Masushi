// src/utils/menu-schema.ts
import { productos } from "../data/productos";

// Este tipo representa un solo plato en el menú de Schema.org
type MenuItemSchema = {
  "@type": "MenuItem";
  name: string;
  description: string;
  image?: string; // Opcional
  offers: {
    "@type": "Offer";
    price: number;
    priceCurrency: "CLP";
  };
};

/**
 * Genera un esquema de menú completo para Schema.org, agrupando productos por categoría.
 */
export function getMenuSchema(origin: string) {
  const menuSections: Record<string, MenuItemSchema[]> = {};

  // Agrupa los productos en el objeto `menuSections` por su categoría
  for (const producto of productos) {
    if (!menuSections[producto.categoria]) {
      menuSections[producto.categoria] = [];
    }

    const { nombre, descripcion, valor, categoria, imagen } = producto;

    // A algunos productos les falta la descripción, usamos una vacía
    const productDescription = descripcion || "";

    // Construye el objeto MenuItem para cada producto
    menuSections[categoria].push({
      "@type": "MenuItem",
      name: nombre,
      description: productDescription,
      image: `${origin}${imagen}`, // Asume que la variable 'imagen' es la ruta a la imagen
      offers: {
        "@type": "Offer",
        price: valor,
        priceCurrency: "CLP",
      },
    });
  }

  // Convierte el objeto de secciones en un arreglo para Schema.org
  const hasMenuSection = Object.entries(menuSections).map(([name, menuItems]) => ({
    "@type": "MenuSection",
    name,
    hasMenuItem: menuItems,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Carta de Masushi",
    url: `${origin}/menu`,
    hasMenuSection,
  };
}