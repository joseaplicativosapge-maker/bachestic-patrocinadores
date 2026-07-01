
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, EliteEvent, Order, TournamentRegistration, AdminSettings, PaymentGateway, AdminUser, SponsorStats, SponsorCommission, SponsorProductCommission } from '../types';
import { apiService } from '../services/api';

interface GalleryItem {
  id: number;
  url: string;
}

interface AppContextType {
  products: Product[];
  cart: CartItem[];
  events: EliteEvent[];
  orders: Order[];
  registrations: TournamentRegistration[];
  galleryImages: GalleryItem[];
  paymentGateways: PaymentGateway[];
  settings: AdminSettings;
  adminUsers: AdminUser[];
  notifications: string[];
  isLoading: boolean;
  addToCart: (product: Product, size: string, quantity: number) => void;
  removeFromCart: (id: string, size: string) => void;
  clearCart: () => void;
  placeOrder: (order: Omit<Order, 'id' | 'created_at' | 'status'>) => void;
  deleteOrder: (id: string) => void;
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;
  addEvent: (event: Omit<EliteEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
  registerTeam: (registration: Omit<TournamentRegistration, 'id'>) => void;
  deleteRegistration: (id: string) => void;
  addGalleryImage: (url: string, projectId?: number) => Promise<void>;
  deleteGalleryImage: (id: number) => Promise<void>;
  updatePaymentGateway: (gateway: PaymentGateway) => void;
  updateAdminUser: (user: AdminUser) => void;
  deleteAdminUser: (id: string) => void;
  updateSettings: (settings: AdminSettings) => void;
  addNotification: (msg: string) => void;
  loginAdmin: (pin: string) => Promise<{ success: boolean; message?: string }>;
  fetchOrders: () => Promise<void>;
  // Sponsor (Patrocinador)
  sponsorRef: string | null;
  setSponsorRef: (ref: string | null) => void;
  sponsorData: any;
  loginSponsor: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logoutSponsor: () => void;
  getSponsorStats: (code: string) => Promise<SponsorStats>;
  getSponsorCommissions: (code: string) => Promise<SponsorCommission[]>;
  getSponsorProductCommissions: (code: string) => Promise<SponsorProductCommission[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [events, setEvents] = useState<EliteEvent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    historyBachestic: '', historyElite: '', ambassadors: '', sponsors: '', deliveryEnabled: true, codEnabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [sponsorRef, setSponsorRef] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
  });
  const [sponsorData, setSponsorData] = useState<any>(() => {
    const saved = sessionStorage.getItem('sponsorData');
    return saved ? JSON.parse(saved) : null;
  });

  const fetchOrders = async () => {
  try {
    const updatedOrders = await apiService.getOrders();
    setOrders(updatedOrders);
  } catch (err) {
    console.error("Error recargando órdenes:", err);
  }
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dbProducts, dbSettings, dbEvents, dbRegs, dbOrders, dbGallery] = await Promise.all([
          apiService.getProducts(),
          apiService.getSettings(),
          apiService.getEvents(),
          apiService.getRegistrations(),
          apiService.getOrders(),
          apiService.getGallery()
        ]);
        setProducts(dbProducts);
        setSettings(dbSettings);
        setEvents(dbEvents);
        setRegistrations(dbRegs);
        setOrders(dbOrders);
        setGalleryImages(dbGallery);
      } catch (err) {
        console.error("Error cargando datos del backend:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (sponsorData) {
      sessionStorage.setItem('sponsorData', JSON.stringify(sponsorData));
    } else {
      sessionStorage.removeItem('sponsorData');
    }
  }, [sponsorData]);

  useEffect(() => {
    if (sponsorRef) {
      apiService.trackSponsorClick(sponsorRef).catch(() => {});
    }
  }, [sponsorRef]);

  const loginAdmin = async (pin: string) => {
    try {
      const response = await apiService.login(pin);
      if (response.success) {
        addNotification(`Bienvenido, ${response.user.name}`);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: "Error de conexión con el servidor" };
    }
  };
  const addNotification = (msg: string) => setNotifications(prev => [msg, ...prev]);

  const addEvent = async (eData: Omit<EliteEvent, 'id'>) => {
    const newId = `EVT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newEvent = { ...eData, id: newId };
    try {
      await apiService.addEvent(newEvent);
      setEvents(prev => [...prev, newEvent]);
      addNotification("Evento agendado con éxito");
    } catch (err) {
      alert("Error al guardar evento");
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await apiService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      addNotification("Evento eliminado");
    } catch (err) {
      alert("Error al eliminar evento");
    }
  };

  const registerTeam = async (registrationData: Omit<TournamentRegistration, 'id'>) => {
    const newId = `REG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const registration = { ...registrationData, id: newId };
    try {
      await apiService.registerTeam(registration);
      setRegistrations(prev => [...prev, registration]);
      addNotification("Inscripción realizada con éxito");
    } catch (err) {
      alert("Error al procesar inscripción");
    }
  };

  const deleteRegistration = async (id: string) => {
    try {
      await apiService.deleteRegistration(id);
      setRegistrations(prev => prev.filter(r => r.id !== id));
      addNotification("Inscripción eliminada");
    } catch (err) {
      alert("Error al eliminar inscripción");
    }
  };

  const addGalleryImage = async (url: string, projectId?: number) => {
    try {
      const newItem = await apiService.addGalleryItem(url, projectId);
      setGalleryImages(prev => [newItem, ...prev]);
      addNotification("Imagen añadida a la galería");
    } catch (err) {
      alert("Error al añadir imagen");
    }
  };

  const deleteGalleryImage = async (id: number) => {
    try {
      await apiService.deleteGalleryItem(id);
      setGalleryImages(prev => prev.filter(img => img.id !== id));
      addNotification("Imagen eliminada de la galería");
    } catch (err) {
      alert("Error al eliminar imagen");
    }
  };

  const addToCart = (product: Product, size: string, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) return prev.map(item => item.id === product.id && item.selectedSize === size ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, selectedSize: size, quantity }];
    });
  };

  const removeFromCart = (id: string, size: string) => setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size)));
  const clearCart = () => setCart([]);

  const placeOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'status'>) => {

    const orderId = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    try {
      await apiService.placeOrder({ ...orderData, id: orderId, sponsor_code: sponsorRef });

      if (orderData.paymentMethod === 'WOMPI') {

        const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/wompi/create-checkout/loselite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: orderData.total * 100,
            customerEmail: orderData.email
          })
        });

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
        return;
      }

      addNotification(`Pedido ${orderId} creado`);
      clearCart();

      const [updatedProducts, updatedOrders] = await Promise.all([
        apiService.getProducts(),
        apiService.getOrders()
      ]);

      setProducts(updatedProducts);
      setOrders(updatedOrders);

    } catch (err) {
      alert("Error al procesar pedido");
    }
  };

  const addProduct = async (pData: Omit<Product, 'id'>) => {
    const newId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const product = { ...pData, id: newId };
    try {
      await apiService.addProduct(product);
      setProducts(prev => [...prev, product]);
    } catch (err) {
      alert("Error al guardar producto");
    }
  };

  const updateProduct = async (updated: Product) => {
    try {
      await apiService.updateProduct(updated);
      setProducts(prev =>
        prev.map(p =>
          p.id === updated.id ? updated : p
        )
      );

    } catch (err) {
      alert("Error al actualizar producto");
    }

  };

  const updateSettings = async (newSettings: AdminSettings) => {
    try {
      await apiService.updateSettings(newSettings);
      setSettings(newSettings);
      addNotification("Ajustes guardados en servidor");
    } catch (err) {
      alert("Error al guardar ajustes");
    }
  };

  const loginSponsor = async (email: string, password: string) => {
    try {
      const response = await apiService.loginSponsor(email, password);
      if (response.success) {
        setSponsorData(response.sponsor);
        addNotification(`Bienvenido, ${response.sponsor.name}`);
        return { success: true };
      }
      return { success: false, message: response.error };
    } catch (err) {
      return { success: false, message: "Error de conexión con el servidor" };
    }
  };

  const logoutSponsor = () => {
    setSponsorData(null);
  };

  const getSponsorStats = async (code: string) => {
    return await apiService.getSponsorStats(code);
  };

  const getSponsorCommissions = async (code: string) => {
    return await apiService.getSponsorCommissions(code);
  };

  const getSponsorProductCommissions = async (code: string) => {
    return await apiService.getSponsorProductCommissions(code);
  };

  return (
    <AppContext.Provider value={{
      products, cart, events, orders, registrations, galleryImages, paymentGateways: [], settings, adminUsers: [], notifications, isLoading,
      addToCart, removeFromCart, clearCart, placeOrder, addEvent, deleteEvent,
      registerTeam, deleteRegistration, addGalleryImage, deleteGalleryImage,
      updateProduct, addProduct, updateSettings, addNotification, loginAdmin, fetchOrders,
      sponsorRef, setSponsorRef, sponsorData, loginSponsor, logoutSponsor,
      getSponsorStats, getSponsorCommissions, getSponsorProductCommissions
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
