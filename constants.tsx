
import { Product, ProductCategory, EliteEvent } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'e1',
    name: 'Jersey Elite "Blackout" 24',
    description: 'Tejido técnico ultra-transpirable con detalles en rojo reflectivo. Edición limitada para competidores de alto rendimiento.',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?auto=format&fit=crop&q=80&w=400',
    stock: 12,
    category: ProductCategory.OFFICIAL,
    sizes: ['S', 'M', 'L', 'XL'],
    segment: 'elite'
  },
  {
    id: 'e2',
    name: 'Shorts Pro "Iron" Dark',
    description: 'Corte ergonómico con costuras reforzadas. Máxima movilidad para el asfalto o la cancha.',
    price: 35.00,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=400',
    stock: 8,
    category: ProductCategory.TRAINING,
    sizes: ['S', 'M', 'L'],
    segment: 'elite'
  },
  {
    id: 'e3',
    name: 'Hoodie Elite Urban Red',
    description: 'Algodón pesado 400 GSM con logo bordado en 3D. Estética agresiva para el post-entrenamiento.',
    price: 75.00,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400',
    stock: 5,
    category: ProductCategory.URBAN,
    sizes: ['M', 'L', 'XL'],
    segment: 'elite'
  },
  {
    id: 'e4',
    name: 'Gorra "Deep Shadow" Elite',
    description: 'Estructura rígida de 6 paneles con cierre snapback. Bordado frontal de alta densidad.',
    price: 28.00,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400',
    stock: 20,
    category: ProductCategory.URBAN,
    sizes: ['U'],
    segment: 'elite'
  },
];

export const INITIAL_TOURNAMENTS: EliteEvent[] = [
  {
    id: '101',
    startDate: '2024-06-15',
    endDate: '2024-06-17',
    category: 'Libre Masculino - 3x3 Street',
    description: 'Torneo de baloncesto callejero. El ganador se lleva el respeto y $2.000 USD.',
    status: 'Abierto',
    type: 'Torneo',
    segment: 'elite',
    notes: 'Es obligatorio presentarse con uniforme de la marca.'
  },
  {
    id: '102',
    startDate: '2024-07-20',
    endDate: '2024-07-22',
    category: 'Workshop Elite Skills',
    description: 'Entrenamiento intensivo con profesionales para mejorar el manejo de balón.',
    status: 'Abierto',
    type: 'Entrenamiento',
    segment: 'elite'
  }
];

export const INITIAL_GALLERY: string[] = [
  'https://images.unsplash.com/photo-1546519638-68e109498ffc',
  'https://images.unsplash.com/photo-1519861531473-9200262188bf',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
  'https://images.unsplash.com/photo-1504450758481-7338eba7524a'
];
