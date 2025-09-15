export type CartItem = {
  id: number;
  codigo: string;  // agregado
  nombre: string;
  valor: number;
  cantidad: number;
};
export type OrderData = {
  name: string;
  phone: string;
  tipoEntrega: "retiro" | "delivery";
  address?: string;
  items: CartItem[];
  total: number;
};

