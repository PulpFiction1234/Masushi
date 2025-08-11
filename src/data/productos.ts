// src/data/productos.ts
export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  valor: number;
  imagen: string;
  categoria: string; // <-- agregado
}

export const productos: Producto[] = [
  {
    id: 1,
    codigo: "S001",
    nombre: "Sushi roll clásico",
    descripcion: "Rollo tradicional de salmón, palta y queso crema.",
    valor: 5000,
    imagen: "/images/sushi-clasico.jpg",
    categoria: "Roll premium"
  },
  {
    id: 2,
    codigo: "S002",
    nombre: "Sushi roll tempura",
    descripcion: "Rollo empanizado y frito, relleno de camarón y queso crema.",
    valor: 5500,
    imagen: "/images/sushi-tempura.jpg",
    categoria: "Hot rolls"
  },
  {
    id: 3,
    codigo: "S003",
    nombre: "Sashimi salmón",
    descripcion: "Finas láminas de salmón fresco de la mejor calidad.",
    valor: 7000,
    imagen: "/images/sashimi-salmon.jpg",
    categoria: "Sashimi"
  },
  {
    id: 4,
    codigo: "S004",
    nombre: "Nigiri mixto",
    descripcion: "Bocados de arroz con pescado fresco surtido.",
    valor: 6000,
    imagen: "/images/nigiri-mixto.jpg",
    categoria: "Nigiri"
  }
];
