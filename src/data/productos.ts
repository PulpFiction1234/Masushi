// data/productos.ts
export interface ProductoOpcion {
  id: string;      // clave estable (ej: "2pollo", "2camaron", "1y1")
  label: string;   // texto visible para el usuario
  precio?: number; // opcional: si alguna opción cambia el precio
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  valor: number;          // precio base
  imagen: string;
  categoria: string;
  opciones?: ProductoOpcion[]; // ← SOLO si el producto tiene variantes
}

// Definición normal (IDs y códigos únicos)
const _productos: Producto[] = [
   {
    id: 57-1,
    codigo: "057",
    nombre: "Handroll",
    descripcion: "Elige el relleno",
    valor: 5500, // ajusta si corresponde
    imagen: "/images/Handroll.png",
    categoria: "Handrolls",
    opciones: [
      { id: "pollo",   label: " pollo" },
      { id: "camaron", label: "camarón" },
    ],
    },
   {
    id: 57-2,
    codigo: "0057",
    nombre: "Promo handrolls",
    descripcion: "Elige la combinación:",
    valor: 10000, // ajusta si corresponde
    imagen: "/images/Promo handroll.png",
    categoria: "Handrolls",
    opciones: [
      { id: "2pollo",   label: "2 de pollo" },
      { id: "2camaron", label: "2 de camarón" },
      { id: "1y1",      label: "1 de pollo y 1 de camarón" },
    ],
  },
  { id: 58, codigo: "058", nombre: "Hosmaki queso crema", descripcion: "Queso crema/Arroz/Nori.", valor: 3500, imagen: "/images/Hosomaki Queso.png", categoria: "Hosomaki" },
  { id: 59, codigo: "059", nombre: "Hosmaki teri", descripcion: "Pollo/Palta/Arroz/Nori.", valor: 3600, imagen: "/images/Hosomaki teri.png", categoria: "Hosomaki" },
  { id: 60, codigo: "060", nombre: "Hosmaki sake", descripcion: "Salmon/Palta/Arroz/Nori.", valor: 3900, imagen: "/images/Hosomaki sake.png", categoria: "Hosomaki" },
  { id: 61, codigo: "061", nombre: "Hosmaki ebi", descripcion: "Camaron/Palta/Arroz/Nori.", valor: 3900, imagen: "/images/Hosomaki ebi.png", categoria: "Hosomaki" },

  { id: 65, codigo: "065", nombre: "Ceviche mixto", descripcion: "Salmon/Camaron/Pimenton/Cebolla morada/Leche de tigre/Palta.", valor: 12900, imagen: "/images/Ceviche mixto.png", categoria: "Ceviche" },

  { id: 66, codigo: "066", nombre: "Nigiri sake", descripcion: "Bolita de arroz/Salmon.", valor: 3400, imagen: "/images/Nigiri sake.png", categoria: "Nigiri" },
  { id: 67, codigo: "067", nombre: "Nigiri ebi", descripcion: "Bolita de arroz/Camaron.", valor: 3400, imagen: "/images/Nigiri ebi.png", categoria: "Nigiri" },
  { id: 68, codigo: "068", nombre: "Nigiri tako", descripcion: "Bolita de arroz/Pulpo.", valor: 3600, imagen: "/images/Nigiri tako.png", categoria: "Nigiri" },

  { id: 73, codigo: "073", nombre: "Camaron Ecuatoriano Furay", descripcion: "5 unidades", valor: 5900, imagen: "/images/Camaron Furay.png", categoria: "Para picar" },
  { id: 74, codigo: "074", nombre: "Pollo Furay", descripcion: "5 unidades", valor: 5900, imagen: "/images/Pollo Furay.png", categoria: "Para picar" },

  { id: 75, codigo: "075", nombre: "Gyozas champiñon queso", descripcion: "5 unidades", valor: 4600, imagen: "/images/Gyozas Champiñon.png", categoria: "Para picar" },
  { id: 76, codigo: "076", nombre: "Gyozas verdura", descripcion: "5 unidades", valor: 4600, imagen: "/images/Gyozas.png", categoria: "Para picar" },
  { id: 77, codigo: "077", nombre: "Gyozas pollo", descripcion: "5 unidades", valor: 4800, imagen: "/images/Gyozas.png", categoria: "Para picar" },
  { id: 78, codigo: "078", nombre: "Gyozas cerdo", descripcion: "5 unidades", valor: 4800, imagen: "/images/Gyozas.png", categoria: "Para picar" },
  { id: 79, codigo: "079", nombre: "Gyozas camaron", descripcion: "5 unidades", valor: 4900, imagen: "/images/Gyozas.png", categoria: "Para picar" },

  { id: 201, codigo: "201", nombre: "Promo mixta (36 piezas)", descripcion: "California kani cheese en sesamo - Ebi cheese roll - Ebi cheese panko - Teri Tori", valor: 18900, imagen: "/images/promo 36piezas.png", categoria: "Promociones" },


 
];

// ❄️ congela cada item y luego el array (inmutabilidad defensiva)
_productos.forEach((p) => Object.freeze(p));
export const productos: ReadonlyArray<Readonly<Producto>> = Object.freeze(_productos);
