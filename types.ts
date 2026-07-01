
export type Segment = 'elite';

export enum ProductCategory {
  OFFICIAL = 'Oficial',
  SPONSOR = 'Patrocinador',
  URBAN = 'Urbano',
  TRAINING = 'Entrenamiento'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: ProductCategory;
  sizes: string[];
  segment: Segment;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

export type EventType = 'Torneo' | 'Entrenamiento' | 'Workshop' | 'Meetup' | 'Otro';

export interface EliteEvent {
  id: string;
  startDate: string;
  endDate: string;
  type: EventType;
  category: string;
  description: string;
  notes?: string;
  status: 'Abierto' | 'Cerrado';
  segment: Segment;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  email: string;
  address: string;
  phone: string;
  paymentMethod: string;
  created_at: string;
  status: 'Pending' | 'Completed';
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamName: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  enabled: boolean;
  publicKey: string;
  secretKey: string;
  mode: 'test' | 'live';
}

export interface AdminSettings {
  historyBachestic: string;
  historyElite: string;
  ambassadors: string;
  sponsors: string;
  ambassadorPhotos: string;
  sponsorPhotos: string;
  deliveryEnabled: boolean;
  codEnabled: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  pin: string;
}

export interface Sponsor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  sponsor_code: string;
  commission_percent: number;
  status: 'pending' | 'active' | 'rejected';
  clicks: number;
  created_at: string;
}

export interface SponsorCommission {
  order_id: string;
  created_at: string;
  total: number;
  status: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  commission_percent: number;
  commission_amount: number;
}

export interface SponsorStats {
  sponsor_code: string;
  commission_percent: number;
  total_orders: number;
  total_commissions: number;
}

export interface SponsorProductCommission {
  product_id: string;
  commission_percent: number;
  name: string;
  price: number;
}
