import React, { useState, useEffect } from 'react';
import { X, Trash2, CreditCard, Truck, MapPin, User, Phone, Mail, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Errors = {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
};

const CartSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (p: string) => void;
}> = ({ isOpen, onClose, onNavigate }) => {

  const { cart, removeFromCart, placeOrder, settings, paymentGateways } = useApp();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [checkoutData, setCheckoutData] = useState({ name: '', email: '', address: '', phone: '' });
  const [errors, setErrors] = useState<Errors>({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message?: string }>({ title: '' });

  const [wompiModalVisible, setWompiModalVisible] = useState(false);
  const [wompiUrl, setWompiUrl] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE + '/api';
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const activeGateway = paymentGateways.find(g => g.enabled);

  // Listener para cerrar el modal automáticamente si Wompi envía postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes('wompi.co')) {
        if (event.data === 'checkout_success') {
          setWompiModalVisible(false);

          placeOrder({
            items: [...cart],
            total,
            customerName: checkoutData.name,
            email: checkoutData.email,
            address: checkoutData.address,
            phone: checkoutData.phone,
            paymentMethod: 'Wompi',
          });

          cart.forEach(item => removeFromCart(item.id, item.selectedSize));
          setModalContent({ title: '¡Pago Completado!', message: 'Tu pedido fue procesado correctamente.' });
          setModalVisible(true);
          setStep('cart');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [cart, checkoutData, total]);

  // Validaciones estilo jQuery Validate
  const validateCheckout = (): boolean => {
    const newErrors: Errors = {};
    if (!checkoutData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!checkoutData.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutData.email)) newErrors.email = 'Email inválido';
    if (!checkoutData.address.trim()) newErrors.address = 'La dirección es obligatoria';
    if (!checkoutData.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCODOrder = () => {
    if (!validateCheckout()) return;

    placeOrder({
      items: [...cart],
      total,
      customerName: checkoutData.name,
      email: checkoutData.email,
      address: checkoutData.address,
      phone: checkoutData.phone,
      paymentMethod: 'Contra Entrega',
    });

    setModalContent({ title: 'Pedido Registrado', message: `¡Gracias ${checkoutData.name}! Tu pedido fue registrado como Contra Entrega.` });
    setModalVisible(true);
    setStep('cart');
  };

  const handleOnlinePayment = async () => {
    if (!validateCheckout()) return;

    try {
      // 1. Primero crear la orden
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
      
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customerName: checkoutData.name,
          email: checkoutData.email,
          address: checkoutData.address,
          phone: checkoutData.phone,
          total,
          paymentMethod: 'WOMPI',
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            selectedSize: item.selectedSize,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!orderRes.ok) throw new Error('Error creando orden');

      const response = await fetch(`${API_BASE}/wompi/create-checkout/loselite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: Math.round(total * 100), // centavos
          customerEmail: checkoutData.email,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // redirigir en lugar de iframe
      } else {
        throw new Error('No se recibió checkoutUrl');
      }
    } catch (error) {
      console.error(error);
      setModalContent({ title: 'Error', message: 'Error conectando con el servidor.' });
      setModalVisible(true);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* SIDEBAR */}
      <div className="fixed inset-0 z-[100] overflow-hidden">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">

            {/* HEADER */}
            <div className="flex items-center justify-between p-8 border-b border-zinc-900">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                {step === 'cart' ? <>Tu <span className="text-red-600">Carrito</span></> : <>Datos de <span className="text-red-600">Entrega</span></>}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* CONTENIDO */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {step === 'cart' ? (
                cart.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700">
                      <Trash2 size={32} />
                    </div>
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">El carrito está vacío.</p>
                    <button onClick={() => { onClose(); onNavigate('tienda'); }}
                      className="mt-6 bg-zinc-900 hover:bg-white hover:text-black text-white px-8 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all">
                      Ir a la Tienda
                    </button>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex gap-4 bg-zinc-900/50 p-4 rounded-[2rem] border border-zinc-800 group">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl shadow-xl" />
                      <div className="flex-1">
                        <h3 className="text-white font-black uppercase text-[9px] italic tracking-widest truncate w-40">{item.name}</h3>
                        <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest">Talla: {item.selectedSize} • Cant: {item.quantity}</p>
                        <p className="text-red-600 font-black mt-1 text-base italic">${Number(item.price * item.quantity).toLocaleString('es-CO')}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="text-zinc-700 hover:text-red-500 transition-colors self-center p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )
              ) : (
                <div className="space-y-5 animate-in fade-in duration-300">

                  {/* NOMBRE */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input placeholder="NOMBRE COMPLETO" value={checkoutData.name} onChange={e => setCheckoutData({ ...checkoutData, name: e.target.value })}
                      className={`w-full bg-black border ${errors.name ? 'border-red-600' : 'border-zinc-800'} text-white p-4 pl-12 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600`} />
                    {errors.name && <span className="text-red-600 text-[8px] mt-1 block">{errors.name}</span>}
                  </div>

                  {/* EMAIL */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input type="email" placeholder="EMAIL" value={checkoutData.email} onChange={e => setCheckoutData({ ...checkoutData, email: e.target.value })}
                      className={`w-full bg-black border ${errors.email ? 'border-red-600' : 'border-zinc-800'} text-white p-4 pl-12 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600`} />
                    {errors.email && <span className="text-red-600 text-[8px] mt-1 block">{errors.email}</span>}
                  </div>

                  {/* DIRECCIÓN */}
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input placeholder="DIRECCIÓN DE ENTREGA" value={checkoutData.address} onChange={e => setCheckoutData({ ...checkoutData, address: e.target.value })}
                      className={`w-full bg-black border ${errors.address ? 'border-red-600' : 'border-zinc-800'} text-white p-4 pl-12 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600`} />
                    {errors.address && <span className="text-red-600 text-[8px] mt-1 block">{errors.address}</span>}
                  </div>

                  {/* TELÉFONO */}
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <input type="tel" placeholder="TELÉFONO / WHATSAPP" value={checkoutData.phone} onChange={e => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                      className={`w-full bg-black border ${errors.phone ? 'border-red-600' : 'border-zinc-800'} text-white p-4 pl-12 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600`} />
                    {errors.phone && <span className="text-red-600 text-[8px] mt-1 block">{errors.phone}</span>}
                  </div>

                  <button onClick={() => setStep('cart')} className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-white transition-colors">← Volver al carrito</button>
                </div>
              )}
            </div>

            {/* RESUMEN Y BOTONES */}
            {cart.length > 0 && (
              <div className="p-8 bg-zinc-950 border-t border-zinc-900">
                <div className="flex justify-between items-center mb-8 px-2">
                  <span className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Resumen Total</span>
                  <span className="text-3xl font-black text-white italic tracking-tighter">${Number(total).toLocaleString('es-CO')}</span>
                </div>
                {step === 'cart' ? (
                  <button onClick={() => setStep('checkout')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white p-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-red-900/30 transition-all active:scale-95">
                    Continuar <ChevronRight size={18} />
                  </button>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={handleOnlinePayment} className="bg-red-600 hover:bg-red-700 text-white p-5 rounded-2xl transition-all font-black uppercase text-[9px] tracking-widest flex flex-col items-center gap-2 shadow-xl shadow-red-900/20 active:scale-95">
                      <CreditCard size={20} /> Pagar con Wompi
                    </button>
                    {!activeGateway && !settings.codEnabled && (
                      <p className="text-zinc-500 text-[9px] font-bold uppercase text-center tracking-widest">No hay métodos de pago activos. Contacta a soporte.</p>
                    )}
                  </div>
                )}
                <p className="text-center text-zinc-600 text-[8px] font-bold uppercase mt-6 tracking-widest">Transacciones 100% seguras y encriptadas.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL ESTILO TIENDA */}
      {modalVisible && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setModalVisible(false)} />
          <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-[3rem] shadow-2xl shadow-black/60 p-10">
            <button onClick={() => setModalVisible(false)} className="absolute top-5 right-5 text-white text-xl font-black rounded-full w-12 h-12 flex items-center justify-center bg-zinc-900/80 border border-zinc-800 hover:bg-red-600 hover:border-red-600 transition-all">✕</button>
            <h2 className="text-5xl font-black uppercase italic tracking-tight mb-6">{modalContent.title}</h2>
            {modalContent.message && <p className="text-zinc-400 text-[14px] tracking-widest">{modalContent.message}</p>}
          </div>
        </div>
      )}

      {/* MODAL Wompi */}
      {wompiModalVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setWompiModalVisible(false)} />
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[3rem] shadow-2xl shadow-black/60 overflow-hidden">
            <button
              onClick={() => setWompiModalVisible(false)}
              className="absolute top-5 right-5 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900/80 border border-zinc-800 hover:bg-red-600 hover:border-red-600 text-white text-xl font-black transition-all"
            >
              ✕
            </button>
            <iframe
              src={wompiUrl}
              className="w-full h-[600px] md:h-[700px] border-none rounded-[2rem]"
              title="Pago Wompi"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CartSidebar;