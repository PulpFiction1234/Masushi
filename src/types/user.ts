// Tipos para el sistema de usuarios, favoritos y pedidos

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: number;
  user_id: string;
  product_code: string;
  created_at: string;
}

export interface OrderItem {
  codigo: string;
  nombre: string;
  valor: number;
  cantidad: number;
  opcion?: {
    id: string;
    label: string;
  };
}

export interface Order {
  id: number;
  user_id: string;
  items: OrderItem[];
  total: number;
  delivery_type: 'retiro' | 'delivery';
  address?: string;
  created_at: string;
}
