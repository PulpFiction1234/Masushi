// data/productos.ts
import type { StaticImageData } from "next/image";
import californiaKaniCheeseImg from "@/public/images/California kani cheese.webp";
import californiaTeriImg from "@/public/images/California teri.webp";
import californiaTeriCheeseImg from "@/public/images/California teri cheese.webp";
import californiaEbiImg from "@/public/images/California ebi.webp";
import californiaEbiCheeseImg from "@/public/images/California ebi cheese.webp";
import californiaSakeCheeseImg from "@/public/images/California sake cheese.webp";
import handrollImg from "@/public/images/Handroll.webp";
import promoHandrollImg from "@/public/images/Promo handroll.webp";
import hosomakiQuesoImg from "@/public/images/Hosomaki Queso.webp";
import hosomakiTeriImg from "@/public/images/Hosomaki teri.webp";
import hosomakiSakeImg from "@/public/images/Hosomaki sake.webp";
import hosomakiEbiImg from "@/public/images/Hosomaki ebi.webp";
import cevicheMixtoImg from "@/public/images/Ceviche mixto.webp";
import nigiriSakeImg from "@/public/images/Nigiri sake.webp";
import nigiriEbiImg from "@/public/images/Nigiri ebi.webp";
import nigiriTakoImg from "@/public/images/Nigiri tako.webp";
import camaronFurayImg from "@/public/images/Camaron Furay.webp";
import polloFurayImg from "@/public/images/Pollo Furay.webp";
import gyozasChampinonImg from "@/public/images/Gyozas Champiñon.webp";
import gyozasImg from "@/public/images/Gyozas.webp";
import promoUnoImg from "@/public/images/promo uno.webp";
import promoHotImg from "@/public/images/promo hot.webp";
import promo36Img from "@/public/images/promo 36piezas.webp";
import promo54Img from "@/public/images/promo 54piezas.webp";
import promoVipImg from "@/public/images/promo vip.webp";

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
  imagen: string | StaticImageData;
  categoria: string;
  opciones?: ProductoOpcion[]; // ← SOLO si el producto tiene variantes
  blurDataUrl?: string;
}

// Definición normal (IDs y códigos únicos)
const _productos: Producto[] = [
    {
      id: 32,
      codigo: "032",
      nombre: "California kani cheese",
      descripcion: "Kanikama/Queso crema/Palta",
      valor: 5300, // ajusta si corresponde
      imagen: californiaKaniCheeseImg,
      categoria: "California rolls",
      opciones: [
        { id: "Sesamo",   label: "Sesamo" },
        { id: "Cibullete", label: "Cibullete" },
        { id: "Masago",      label: "Masago" },
      ],
    },   
    {
      id: 33,
      codigo: "033",
      nombre: "California teri",
      descripcion: "Pollo teriyaki/Palta",
      valor: 5400, // ajusta si corresponde
      imagen: californiaTeriImg,
      categoria: "California rolls",
      opciones: [
        { id: "Sesamo",   label: "Sesamo" },
        { id: "Cibullete", label: "Cibullete" },
        { id: "Masago",      label: "Masago" },
      ],
    },
    {
    id: 34,
    codigo: "034",
    nombre: "California teri cheese",
    descripcion: "Pollo teriyaki/Queso crema/Palta",
    valor: 5600, // ajusta si corresponde
    imagen: californiaTeriCheeseImg,
    categoria: "California rolls",
    opciones: [
      { id: "Sesamo",   label: "Sesamo" },
      { id: "Cibullete", label: "Cibullete" },
      { id: "Masago",      label: "Masago" },
    ],
    },
    {
    id: 35,
    codigo: "035",
    nombre: "California ebi",
    descripcion: "Camaron/Palta",
    valor: 5600, // ajusta si corresponde
    imagen: californiaEbiImg,
    categoria: "California rolls",
    opciones: [
      { id: "Sesamo",   label: "Sesamo" },
      { id: "Cibullete", label: "Cibullete" },
      { id: "Masago",      label: "Masago" },
    ],
    },
     {
    id: 36,
    codigo: "036",
    nombre: "California ebi cheese",
    descripcion: "Camaron/Queso crema/Palta",
    valor: 5600, // ajusta si corresponde
    imagen: californiaEbiCheeseImg,
    categoria: "California rolls",
    opciones: [
      { id: "Sesamo",   label: "Sesamo" },
      { id: "Cibullete", label: "Cibullete" },
      { id: "Masago",      label: "Masago" },
    ],
    },
     {
    id: 38,
    codigo: "038",
    nombre: "California sake cheese",
    descripcion: "Salmon/Queso crema/Palta",
    valor: 5600, // ajusta si corresponde
    imagen: californiaSakeCheeseImg,
    categoria: "California rolls",
    opciones: [
      { id: "Sesamo",   label: "Sesamo" },
      { id: "Cibullete", label: "Cibullete" },
      { id: "Masago",      label: "Masago" },
    ],
    },
  {
    id: 57-1,
    codigo: "057",
    nombre: "Handroll",
    descripcion: "Elige el relleno",
    valor: 5500, // ajusta si corresponde
    imagen: handrollImg,
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
    imagen: promoHandrollImg,
    categoria: "Handrolls",
    opciones: [
      { id: "2pollo",   label: "2 de pollo" },
      { id: "2camaron", label: "2 de camarón" },
      { id: "1y1",      label: "1 de pollo y 1 de camarón" },
    ],
  },
{ id: 58, codigo: "058", nombre: "Hosomaki queso crema", descripcion: "Queso crema/Arroz/Nori.", valor: 3500, imagen: hosomakiQuesoImg, categoria: "Hosomaki" },
{ id: 59, codigo: "059", nombre: "Hosomaki teri", descripcion: "Pollo/Palta/Arroz/Nori.", valor: 3600, imagen: hosomakiTeriImg, categoria: "Hosomaki" },
{ id: 60, codigo: "060", nombre: "Hosomaki sake", descripcion: "Salmon/Palta/Arroz/Nori.", valor: 3900, imagen: hosomakiSakeImg, categoria: "Hosomaki" },
{ id: 61, codigo: "061", nombre: "Hosomaki ebi", descripcion: "Camaron/Palta/Arroz/Nori.", valor: 3900, imagen: hosomakiEbiImg, categoria: "Hosomaki" },

{ id: 65, codigo: "065", nombre: "Ceviche mixto", descripcion: "Salmon/Camaron/Pimenton/Cebolla morada/Leche de tigre/Palta.", valor: 12900, imagen: cevicheMixtoImg, categoria: "Ceviche" },

{ id: 66, codigo: "066", nombre: "Nigiri sake", descripcion: "Bolita de arroz/Salmon.", valor: 3400, imagen: nigiriSakeImg, categoria: "Nigiri" },
{ id: 67, codigo: "067", nombre: "Nigiri ebi", descripcion: "Bolita de arroz/Camaron.", valor: 3400, imagen: nigiriEbiImg, categoria: "Nigiri" },
{ id: 68, codigo: "068", nombre: "Nigiri tako", descripcion: "Bolita de arroz/Pulpo.", valor: 3600, imagen: nigiriTakoImg, categoria: "Nigiri" },

{ id: 73, codigo: "073", nombre: "Camaron Ecuatoriano Furay", descripcion: "5 unidades", valor: 5900, imagen: camaronFurayImg, categoria: "Para picar" },
{ id: 74, codigo: "074", nombre: "Pollo Furay", descripcion: "5 unidades", valor: 5900, imagen: polloFurayImg, categoria: "Para picar" },

{ id: 75, codigo: "075", nombre: "Gyozas champiñon queso", descripcion: "5 unidades", valor: 4600, imagen: gyozasChampinonImg, categoria: "Para picar" },
{ id: 76, codigo: "076", nombre: "Gyozas verdura", descripcion: "5 unidades", valor: 4600, imagen: gyozasImg, categoria: "Para picar" },
{ id: 77, codigo: "077", nombre: "Gyozas pollo", descripcion: "5 unidades", valor: 4800, imagen: gyozasImg, categoria: "Para picar" },
{ id: 78, codigo: "078", nombre: "Gyozas cerdo", descripcion: "5 unidades", valor: 4800, imagen: gyozasImg, categoria: "Para picar" },
{ id: 79, codigo: "079", nombre: "Gyozas camaron", descripcion: "5 unidades", valor: 4900, imagen: gyozasImg, categoria: "Para picar" },
{ id: 200, codigo: "200", nombre: "Promo uno (18 piezas)", descripcion: "Ebi cheese roll en palta - California teri cheese", valor: 10900, imagen: promoUnoImg, categoria: "Promociones" },
{ id: 201, codigo: "201", nombre: "Promo HOT (36 piezas)", descripcion: "Teri tori - Ebi cheese panko - Funji cheese panko- Kani cheese panko", valor: 18900, imagen: promoHotImg, categoria: "Promociones" },
{ id: 202, codigo: "202", nombre: "Promo mixta (36 piezas)", descripcion: "California kani cheese en sesamo - Ebi cheese roll en palta - Ebi cheese panko - Teri Tori", valor: 18900, imagen: promo36Img, categoria: "Promociones" },
{ id: 203, codigo: "203", nombre: "Promo mixta (54 piezas)", descripcion: "California teri cheese en sesamo - California sake cheese en ciboullete - Ebi cheese roll en palta - Fuji cheese panko - Ebi cheese panko - Teri Tori", valor: 27900, imagen: promo54Img, categoria: "Promociones" },
{ id: 204, codigo: "204", nombre: "Promo vip (72 piezas)", descripcion: "Ebi cheese roll en palta - Teri roll en queso - Sake cheese roll en salmon - California ebi cheese en sesamo - Mechada panko - Sake cheese panko - Teri tori - Ebi cheese Panko", valor: 38900, imagen: promoVipImg, categoria: "Promociones" },


 
];

// ❄️ congela cada item y luego el array (inmutabilidad defensiva)
_productos.forEach((p) => Object.freeze(p));
export const productos: ReadonlyArray<Readonly<Producto>> = Object.freeze(_productos);
