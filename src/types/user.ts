// Tipos para el sistema de usuarios, favoritos y pedidos

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  birthday?: string | null;
  address?: string; // Dirección de delivery opcional
  created_at: string;
  updated_at: string;
  // Optional admin marker / role. Can be either a boolean flag or a string role name.
  is_admin?: boolean | null;
  role?: string | null;
}

export interface Favorite {
  id: number;
  user_id: string;
  product_code: string;
  created_at: string;
}

export interface OrderItem {
  codigo: string;
  cantidad: number;
  opcion?: {
    id: string;
    label: string;
  };
}

// Interfaz extendida para cuando se muestra con datos del producto
export interface OrderItemWithDetails extends OrderItem {
  nombre: string;
  valor: number;
  imagen?: string;
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
