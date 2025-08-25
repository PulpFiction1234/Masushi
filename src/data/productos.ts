// data/productos.ts
import type { StaticImageData } from "next/image";

//california rolls
import californiaKaniCheeseImg from "@/public/images/California kani cheese.webp";
import californiaTeriImg from "@/public/images/California teri.webp";
import californiaTeriCheeseImg from "@/public/images/California teri cheese.webp";
import californiaEbiImg from "@/public/images/California ebi.webp";
import CaliforniaSakeImg from "@/public/images/California sake.webp";
import CaliforniaTakoImg from "@/public/images/California tako cheese.webp";
import californiaEbiCheeseImg from "@/public/images/California ebi cheese.webp";
import CaliforniaSakeCheeseImg from "@/public/images/california sake cheesse.webp";

//hot rolls 
import MechadaPankoImg from "@/public/images/Mechada panko.webp";
import HotatePankoImg from "@/public/images/Hotate panko.webp";
import TeriToriImg from "@/public/images/Teri tori.webp";
import TakoPankoImg from "@/public/images/Tako panko.webp";
import SakePankoImg from "@/public/images/Sake panko.webp";
import EbiPankoImg from "@/public/images/Ebi panko.webp";
import KaniPankoImg from "@/public/images/Kani panko.webp";
import SabiPankoImg from "@/public/images/Sabi panko.webp";


//handrolls
import handrollImg from "@/public/images/Handroll.webp";
import promoHandrollImg from "@/public/images/Promo handroll.webp";

//hosomaki
import hosomakiQuesoImg from "@/public/images/Hosomaki queso.webp";
import hosomakiTeriImg from "@/public/images/Hosomaki teri.webp";
import hosomakiSakeImg from "@/public/images/Hosomaki sake.webp";
import hosomakiEbiImg from "@/public/images/Hosomaki ebi.webp";

//ceviche
import cevicheMixtoImg from "@/public/images/Ceviche mixto.webp";

//nigiri
import nigiriSakeImg from "@/public/images/Nigiri sake.webp";
import nigiriEbiImg from "@/public/images/Nigiri ebi.webp";
import nigiriTakoImg from "@/public/images/Nigiri tako.webp";

//para picar
import camaronFurayImg from "@/public/images/Camaron furay.webp";
import polloFurayImg from "@/public/images/Pollo furay.webp";
import gyozasChampinonImg from "@/public/images/Gyozas champiñon.webp";
import gyozasImg from "@/public/images/Gyozas.webp";

// promociones
import promoUnoImg from "@/public/images/promo uno.webp";
import promoHotImg from "@/public/images/promo hot.webp";
import promo36Img from "@/public/images/promo 36piezas.webp";
import promo54Img from "@/public/images/promo 54piezas.webp";
import promoVipImg from "@/public/images/promo vip.webp";

//en salmon
import TeriCheeseSalmonImg from "@/public/images/Teri cheese roll en salmon.webp";
import SakeSalmonImg from "@/public/images/Sake roll en salmon.webp";
import SakeCheeseSalmonImg from "@/public/images/Sake cheese roll en salmon.webp";
import EbiCheeseSalmonImg from "@/public/images/Ebi cheese roll en salmon.webp";
import SabiSalmonImg from "@/public/images/Sabi roll en salmon.webp";
import TakoCheeseSalmonImg from "@/public/images/Tako cheese roll en salmon.webp";
import EbiFuraySalmonImg from "@/public/images/Ebi furay cheese roll en salmon.webp";

// Bebidas
import arizonaMangoImg from "@/public/images/Arizona mango.webp";
import arizonaSandiaImg from "@/public/images/Arizona sandia.webp";
import arizonaUvaImg from "@/public/images/Arizona uva.webp";
import cocaColaOriginalLataImg from "@/public/images/Coca cola original lata.webp";
import cocaColaZeroLataImg from "@/public/images/Coca cola zero lata.webp";
import cocaColaOriginalBotellaImg from "@/public/images/Coca cola original 1.5.webp";
import cocaColaZeroBotellaImg from "@/public/images/Coca cola zero 1.5.webp";
import spriteLataImg from "@/public/images/Sprite lata.webp";
import spriteBotellaImg from "@/public/images/Sprite 1.5.webp";
import monsterVerdeImg from "@/public/images/Monster verde.webp";


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
  salsasGratis?: number;
  topePalitosGratis?: number;
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
    id: 37,
    codigo: "037",
    nombre: "California sake",
    descripcion: "Salmon/Palta",
    valor: 5900, // ajusta si corresponde
    imagen: CaliforniaSakeImg,
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
    imagen: CaliforniaSakeCheeseImg,
    categoria: "California rolls",
    opciones: [
      { id: "Sesamo",   label: "Sesamo" },
      { id: "Cibullete", label: "Cibullete" },
      { id: "Masago",      label: "Masago" },
    ],
    },
      {
    id: 39,
    codigo: "039",
    nombre: "California tako cheese",
    descripcion: "Pulpo/Queso crema/Palta",
    valor: 6400, // ajusta si corresponde
    imagen: CaliforniaTakoImg,
    categoria: "California rolls",
    opciones: [
      { id: "Sesamo",   label: "Sesamo" },
      { id: "Cibullete", label: "Cibullete" },
      { id: "Masago",      label: "Masago" },
    ],
    },
  {
    id: 57,
    codigo: "057",
    nombre: "Handroll",
    descripcion: "Elige el relleno",
    valor: 5500, // ajusta si corresponde
    imagen: handrollImg,
    categoria: "Handrolls",
    topePalitosGratis: 0,
    opciones: [
      { id: "pollo",   label: " pollo" },
      { id: "camaron", label: "camarón" },
    ],
    },
   {
    id: 57.1,
    codigo: "0057",
    nombre: "Promo handrolls",
    descripcion: "Elige la combinación:",
    valor: 10000, // ajusta si corresponde
    imagen: promoHandrollImg,
    categoria: "Handrolls",
    salsasGratis: 2,
    topePalitosGratis: 0,
    opciones: [
      { id: "2pollo",   label: "2 de pollo" },
      { id: "2camaron", label: "2 de camarón" },
      { id: "1y1",      label: "1 de pollo y 1 de camarón" },
    ],
  },

  //en salmon
{ id: 25, codigo: "025", nombre: "Teri cheese roll en salmon", descripcion: "Pollo - Queso crema - Palta - En salmon.", valor: 6400, imagen: TeriCheeseSalmonImg, categoria: "Rolls envueltos en salmon" },
{ id: 26, codigo: "026", nombre: "Sake roll en salmon", descripcion: "Salmon - Palta - Cebollin - En salmon.", valor: 6600, imagen: SakeSalmonImg, categoria: "Rolls envueltos en salmon" },
{ id: 27, codigo: "027", nombre: "Sake cheese roll en salmon", descripcion: "Salmon - Queso crema - Palta - En salmon.", valor: 6900, imagen: SakeCheeseSalmonImg, categoria: "Rolls envueltos en salmon" },
{ id: 28, codigo: "028", nombre: "Ebi cheese roll en salmon", descripcion: "Camaron - Queso crema - Palta - En salmon.", valor: 6700, imagen: EbiCheeseSalmonImg, categoria: "Rolls envueltos en salmon" },
{ id: 29, codigo: "029", nombre: "Sabi roll en salmon", descripcion: "Salmon - Queso crema - Camaron - En salmon.", valor: 6900, imagen: SabiSalmonImg, categoria: "Rolls envueltos en salmon" },
{ id: 30, codigo: "030", nombre: "Tako cheese roll en salmon", descripcion: "Pulpo - Queso crema - Palta - En salmon.", valor: 6900, imagen: TakoCheeseSalmonImg, categoria: "Rolls envueltos en salmon" },  
{ id: 31, codigo: "031", nombre: "Ebi furay cheese roll en salmon", descripcion: "Camaron apanado - Queso crema - Cebollin - En salmon.", valor: 6900, imagen: EbiFuraySalmonImg, categoria: "Rolls envueltos en salmon" },


// Hot rolls
{ id: 48, codigo: "048", nombre: "Kani panko", descripcion: "Kanikama - Queso crema - Cebollin - En panko.", valor: 5900, imagen: KaniPankoImg, categoria: "Hot rolls" },
{ id: 49, codigo: "049", nombre: "Ebi cheese panko", descripcion: "Camaron - Queso crema - Cebollin - En panko.", valor: 6500, imagen: EbiPankoImg, categoria: "Hot rolls" },
{ id: 51, codigo: "051", nombre: "Sabi panko", descripcion: "Salmon - Camaron - Queso crema - En panko.", valor: 6900, imagen: SabiPankoImg, categoria: "Hot rolls" },
{ id: 50, codigo: "050", nombre: "Teri tori", descripcion: "Pollo - Queso crema - Cebollin - En panko.", valor: 6400, imagen: TeriToriImg, categoria: "Hot rolls" },
{ id: 52, codigo: "052", nombre: "Sake cheese panko", descripcion: "Salmon - Queso crema - Cebollin - En panko.", valor: 6800, imagen: SakePankoImg, categoria: "Hot rolls" },
{ id: 53, codigo: "053", nombre: "Tako panko", descripcion: "Pulpo - Queso crema - Cebollin - En panko.", valor: 7100, imagen: TakoPankoImg, categoria: "Hot rolls" },
{ id: 54, codigo: "054", nombre: "Hotate panko", descripcion: "Ostion furay - Queso crema - Cebollin - En panko.", valor: 7100, imagen: HotatePankoImg, categoria: "Hot rolls" },
{ id: 56, codigo: "056", nombre: "Mechada panko", descripcion: "Carne mechada - Queso crema - Cebollin - En panko.", valor: 7100, imagen: MechadaPankoImg, categoria: "Hot rolls" }, 



{ id: 58, codigo: "058", nombre: "Hosomaki queso crema", descripcion: "Queso crema - Arroz/Nori.", valor: 3500, imagen: hosomakiQuesoImg, categoria: "Hosomaki" },
{ id: 59, codigo: "059", nombre: "Hosomaki teri", descripcion: "Pollo - Palta - Arroz - Nori.", valor: 3600, imagen: hosomakiTeriImg, categoria: "Hosomaki" },
{ id: 60, codigo: "060", nombre: "Hosomaki sake", descripcion: "Salmon - Palta - Arroz - Nori.", valor: 3900, imagen: hosomakiSakeImg, categoria: "Hosomaki" },
{ id: 61, codigo: "061", nombre: "Hosomaki ebi", descripcion: "Camaron - Palta - Arroz - Nori.", valor: 3900, imagen: hosomakiEbiImg, categoria: "Hosomaki" },


{ id: 65, codigo: "065", nombre: "Ceviche mixto", descripcion: "Salmon/Camaron/Pimenton/Cebolla morada/Leche de tigre/Palta.", valor: 12900, imagen: cevicheMixtoImg, categoria: "Ceviche" },

{ id: 66, codigo: "066", nombre: "Nigiri sake", descripcion: "Bolita de arroz - Salmon.", valor: 3400, imagen: nigiriSakeImg, categoria: "Nigiri" },
{ id: 67, codigo: "067", nombre: "Nigiri ebi", descripcion: "Bolita de arroz - Camaron.", valor: 3400, imagen: nigiriEbiImg, categoria: "Nigiri" },
{ id: 68, codigo: "068", nombre: "Nigiri tako", descripcion: "Bolita de arroz - Pulpo.", valor: 3600, imagen: nigiriTakoImg, categoria: "Nigiri" },

{ id: 73, codigo: "073", nombre: "Camaron Ecuatoriano Furay", descripcion: "5 unidades", valor: 5900, imagen: camaronFurayImg, categoria: "Para picar" },
{ id: 74, codigo: "074", nombre: "Pollo Furay", descripcion: "5 unidades", valor: 5900, imagen: polloFurayImg, categoria: "Para picar" },

{ id: 75, codigo: "075", nombre: "Gyozas champiñon queso", descripcion: "5 unidades", valor: 4600, imagen: gyozasChampinonImg, categoria: "Para picar" },
{ id: 76, codigo: "076", nombre: "Gyozas verdura", descripcion: "5 unidades", valor: 4600, imagen: gyozasImg, categoria: "Para picar" },
{ id: 77, codigo: "077", nombre: "Gyozas pollo", descripcion: "5 unidades", valor: 4800, imagen: gyozasImg, categoria: "Para picar" },
{ id: 78, codigo: "078", nombre: "Gyozas cerdo", descripcion: "5 unidades", valor: 4800, imagen: gyozasImg, categoria: "Para picar" },
{ id: 79, codigo: "079", nombre: "Gyozas camaron", descripcion: "5 unidades", valor: 4900, imagen: gyozasImg, categoria: "Para picar" },


// Promociones
{ id: 200, codigo: "200", nombre: "Promo uno (18 piezas)", descripcion: "Ebi cheese roll en palta - California teri cheese", valor: 10900, imagen: promoUnoImg, categoria: "Promociones",salsasGratis: 2,topePalitosGratis: 2 },
{ id: 201, codigo: "201", nombre: "Promo HOT (36 piezas)", descripcion: "Teri tori - Ebi cheese panko - Funji cheese panko- Kani cheese panko", valor: 18900, imagen: promoHotImg, categoria: "Promociones",salsasGratis: 5,topePalitosGratis: 5 },
{ id: 202, codigo: "202", nombre: "Promo mixta (36 piezas)", descripcion: "California kani cheese en sesamo - Ebi cheese roll en palta - Ebi cheese panko - Teri Tori", valor: 18900, imagen: promo36Img, categoria: "Promociones",salsasGratis: 5,topePalitosGratis: 5 },
{ id: 203, codigo: "203", nombre: "Promo mixta (54 piezas)", descripcion: "California teri cheese en sesamo - California sake cheese en ciboullete - Ebi cheese roll en palta - Fuji cheese panko - Ebi cheese panko - Teri Tori", valor: 27900, imagen: promo54Img, categoria: "Promociones", salsasGratis: 8,topePalitosGratis: 6 },
{ id: 204, codigo: "204", nombre: "Promo vip (72 piezas)", descripcion: "Ebi cheese roll en palta - Teri roll en queso - Sake cheese roll en salmon - California ebi cheese en sesamo - Mechada panko - Sake cheese panko - Teri tori - Ebi cheese Panko", valor: 38900, imagen: promoVipImg, categoria: "Promociones", salsasGratis: 10, topePalitosGratis:10},





// Bebidas
{ id: 301, codigo: "83", nombre: "Coca Cola Original lata", descripcion: "Bebida gaseosa en lata 350 ml", valor: 1600, imagen: cocaColaOriginalLataImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 302, codigo: "83", nombre: "Coca Cola Zero lata", descripcion: "Bebida gaseosa en lata 350 ml", valor: 1600, imagen: cocaColaZeroLataImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 303, codigo: "83", nombre: "Sprite lata", descripcion: "Bebida gaseosa en lata 350 ml", valor: 1600, imagen: spriteLataImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
//{ id: 84-1, codigo: "84", nombre: "Jumex mango lata", descripcion: "Nectar jumex mango 335ml", valor: 1600, imagen: cocaColaOriginalLataImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
//{ id: 84-2, codigo: "084", nombre: "Jumex piña lata", descripcion: "Nectar jumex piña 335ml", valor: 1600, imagen: cocaColaZeroLataImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
//{ id: 84-3, codigo: "0084", nombre: "Jumex piña-coco lata", descripcion: "Nectar jumex piña-coco 335ml", valor: 1600, imagen: spriteLataImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 307, codigo: "85", nombre: "Arizona Mango", descripcion: "Jugo en lata 500 ml", valor: 2500, imagen: arizonaMangoImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 308, codigo: "85", nombre: "Arizona Sandía", descripcion: "Jugo en lata 500 ml", valor: 2500, imagen: arizonaSandiaImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 309, codigo: "85", nombre: "Arizona Uva", descripcion: "Jugo en lata 500 ml", valor: 2500, imagen: arizonaUvaImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 310, codigo: "86", nombre: "Monster verde", descripcion: "Bebida energética 473 ml", valor: 2500, imagen: monsterVerdeImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 311, codigo: "87", nombre: "Coca Cola Original 1.5 L", descripcion: "Bebida gaseosa botella 1.5 L", valor: 3000, imagen: cocaColaOriginalBotellaImg, categoria: "Bebidas", salsasGratis: 0 ,topePalitosGratis: 0 },
{ id: 312, codigo: "87", nombre: "Coca Cola Zero 1.5 L", descripcion: "Bebida gaseosa botella 1.5 L", valor: 3000, imagen: cocaColaZeroBotellaImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },
{ id: 313, codigo: "87", nombre: "Sprite 1.5 L", descripcion: "Bebida gaseosa botella 1.5 L", valor: 3000, imagen: spriteBotellaImg, categoria: "Bebidas", salsasGratis: 0,topePalitosGratis: 0 },


 
];

// ❄️ congela cada item y luego el array (inmutabilidad defensiva)
_productos.forEach((p) => Object.freeze(p));
export const productos: ReadonlyArray<Readonly<Producto>> = Object.freeze(_productos);
