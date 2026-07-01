import React, { useState } from 'react';
import {
  ShoppingCart,
  X,
  Trash2,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Tag,
  TestTube,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  selectedSize: string;
  quantity: number;
}

interface WompiCheckoutProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, size: string, delta: number) => void;
  onRemoveItem: (id: string, size: string) => void;
  onClearCart: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE + '/api';

// Detects test mode based on the public key prefix
const IS_TEST_MODE =
  (import.meta.env.VITE_WOMPI_PUBLIC_KEY_LOSELITE || '').startsWith('pub_test_');

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const WompiCheckout: React.FC<WompiCheckoutProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<'cart' | 'form' | 'processing'>('cart');
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Wompi uses amount in cents
  const totalCents = Math.round(subtotal * 100);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.customerName.trim()) errs.customerName = 'Nombre requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email inválido';
    if (!/^\d{7,15}$/.test(formData.phone.replace(/\s/g, '')))
      errs.phone = 'Teléfono inválido (solo dígitos, 7-15)';
    if (!formData.address.trim()) errs.address = 'Dirección requerida';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheckout = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setApiError(null);
    setStep('processing');

    try {
      // 1. Generate order ID
      const orderId = `ELITE-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      // 2. Create order in backend
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customerName: formData.customerName,
          email: formData.email,
          address: formData.address,
          phone: formData.phone,
          total: subtotal,
          paymentMethod: 'WOMPI',
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            selectedSize: item.selectedSize,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${orderRes.status} al crear la orden`);
      }

      // 3. Request Wompi checkout URL from backend (loselite endpoint)
      const checkoutRes = await fetch(`${API_BASE}/wompi/create-checkout/loselite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: totalCents,
          customerEmail: formData.email,
        }),
      });

      if (!checkoutRes.ok) {
        const errData = await checkoutRes.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${checkoutRes.status} al generar el checkout`);
      }

      const { checkoutUrl } = await checkoutRes.json();

      // 4. Clear cart before redirect
      onClearCart();

      // 5. Redirect to Wompi
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error('Wompi checkout error:', err);
      setApiError(err.message || 'Error inesperado. Intenta de nuevo.');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('cart');
    setFormData({ customerName: '', email: '', phone: '', address: '' });
    setErrors({});
    setApiError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={step !== 'processing' ? resetAndClose : undefined}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-[3rem] md:rounded-[3rem] shadow-2xl shadow-black max-h-[92vh] flex flex-col overflow-hidden">

        {/* TEST MODE BANNER */}
        {IS_TEST_MODE && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5">
            <TestTube size={14} className="text-amber-400 shrink-0" />
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
              Modo Prueba — Ningún cobro real será procesado
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'cart' && <ShoppingCart size={20} className="text-red-600" />}
            {step === 'form' && <CreditCard size={20} className="text-red-600" />}
            {step === 'processing' && <Loader2 size={20} className="text-red-600 animate-spin" />}
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">
                {step === 'cart' && 'Carrito'}
                {step === 'form' && 'Datos de Envío'}
                {step === 'processing' && 'Procesando...'}
              </h3>
              {step === 'cart' && (
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                  {cartItems.length} producto{cartItems.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {step !== 'processing' && (
            <button
              onClick={resetAndClose}
              className="p-2.5 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-0 px-8 py-4 border-b border-zinc-900 shrink-0">
          {(['cart', 'form'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                    step === s
                      ? 'bg-red-600 text-white'
                      : step === 'processing' || (s === 'cart' && step === 'form')
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-600'
                  }`}
                >
                  {step === 'processing' || (s === 'cart' && step === 'form') ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    step === s ? 'text-white' : 'text-zinc-600'
                  }`}
                >
                  {s === 'cart' ? 'Carrito' : 'Datos'}
                </span>
              </div>
              {i < 1 && <ChevronRight size={14} className="text-zinc-700 mx-3" />}
            </React.Fragment>
          ))}
          <ChevronRight size={14} className="text-zinc-700 mx-3" />
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                step === 'processing' ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-600'
              }`}
            >
              {step === 'processing' ? <Loader2 size={12} className="animate-spin" /> : 3}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${step === 'processing' ? 'text-white' : 'text-zinc-600'}`}>
              Pago
            </span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP: CART ── */}
          {step === 'cart' && (
            <div className="p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-4 text-center">
                  <ShoppingCart size={48} className="text-zinc-800" />
                  <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">
                    Tu carrito está vacío
                  </p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div
                    key={`${item.id}-${item.selectedSize}`}
                    className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white uppercase truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded-lg">
                          <Tag size={8} className="inline mr-1" />
                          {item.selectedSize}
                        </span>
                        <span className="text-[10px] font-black text-red-500">
                          {formatCOP(item.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center bg-zinc-800 rounded-xl overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, -1)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all font-black text-lg"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-black text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, +1)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all font-black text-lg"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] font-black text-zinc-400">
                          = {formatCOP(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id, item.selectedSize)}
                      className="self-start p-2 text-zinc-700 hover:text-red-500 hover:bg-red-600/10 rounded-xl transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── STEP: FORM ── */}
          {step === 'form' && (
            <div className="p-6 space-y-4">
              {apiError && (
                <div className="flex items-start gap-3 bg-red-600/10 border border-red-600/30 p-4 rounded-2xl">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-400">{apiError}</p>
                </div>
              )}

              {[
                {
                  key: 'customerName',
                  label: 'Nombre completo',
                  type: 'text',
                  placeholder: 'Ej: Juan Pérez',
                  icon: User,
                },
                {
                  key: 'email',
                  label: 'Correo electrónico',
                  type: 'email',
                  placeholder: 'tu@correo.com',
                  icon: Mail,
                },
                {
                  key: 'phone',
                  label: 'Teléfono / WhatsApp',
                  type: 'tel',
                  placeholder: '3001234567',
                  icon: Phone,
                },
                {
                  key: 'address',
                  label: 'Dirección de envío',
                  type: 'text',
                  placeholder: 'Calle 123 #45-67, Ciudad',
                  icon: MapPin,
                },
              ].map(({ key, label, type, placeholder, icon: Icon }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">
                    {label}
                  </label>
                  <div className="relative">
                    <Icon
                      size={15}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                    />
                    <input
                      type={type}
                      value={(formData as any)[key]}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className={`w-full bg-black pl-10 pr-4 py-4 rounded-2xl text-sm font-bold text-white outline-none transition-all border ${
                        errors[key]
                          ? 'border-red-500/60 bg-red-500/5'
                          : 'border-zinc-800 focus:border-red-600'
                      }`}
                    />
                  </div>
                  {errors[key] && (
                    <p className="text-[9px] font-bold text-red-500 flex items-center gap-1">
                      <AlertTriangle size={10} /> {errors[key]}
                    </p>
                  )}
                </div>
              ))}

              {/* Order summary */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 mt-2">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">
                  Resumen del pedido
                </p>
                {cartItems.map(item => (
                  <div
                    key={`${item.id}-${item.selectedSize}`}
                    className="flex justify-between text-xs font-bold text-zinc-400"
                  >
                    <span>
                      {item.name} x{item.quantity}{' '}
                      <span className="text-zinc-600">({item.selectedSize})</span>
                    </span>
                    <span>{formatCOP(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-zinc-800 pt-2 flex justify-between">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    Total
                  </span>
                  <span className="text-lg font-black text-red-500">{formatCOP(subtotal)}</span>
                </div>
              </div>

              {IS_TEST_MODE && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <TestTube size={12} /> Datos de prueba Wompi
                  </p>
                  <div className="text-[9px] font-bold text-amber-400/70 space-y-1">
                    <p>Tarjeta: <span className="font-black text-amber-300">4242 4242 4242 4242</span></p>
                    <p>Fecha: <span className="font-black text-amber-300">12/29</span> · CVV: <span className="font-black text-amber-300">123</span></p>
                    <p>Nombre: <span className="font-black text-amber-300">Cualquier nombre</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: PROCESSING ── */}
          {step === 'processing' && (
            <div className="py-20 flex flex-col items-center gap-6 px-8">
              <div className="w-20 h-20 bg-red-600/10 border border-red-600/20 rounded-full flex items-center justify-center">
                <Loader2 size={36} className="text-red-600 animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-white font-black uppercase tracking-tight text-lg">
                  Preparando tu pago
                </p>
                <p className="text-zinc-500 text-xs font-bold">
                  Estamos creando tu orden y conectando con Wompi…
                </p>
                <p className="text-zinc-600 text-[9px] uppercase tracking-widest">
                  Serás redirigido en un momento
                </p>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl">
                <Lock size={12} className="text-green-500" />
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                  Pago 100% seguro con Wompi
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {step !== 'processing' && (
          <div className="p-6 border-t border-zinc-900 shrink-0 space-y-3">
            {step === 'cart' && cartItems.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Total
                  </span>
                  <span className="text-2xl font-black text-white">{formatCOP(subtotal)}</span>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-red-900/30 flex items-center justify-center gap-3"
                >
                  Continuar al pago <ChevronRight size={16} />
                </button>
              </>
            )}

            {step === 'form' && (
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-red-900/30 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                  ) : (
                    <><Lock size={16} /> Pagar con Wompi</>
                  )}
                </button>
                <button
                  onClick={() => { setStep('cart'); setApiError(null); }}
                  className="w-full text-zinc-600 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors py-2"
                >
                  ← Volver al carrito
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WompiCheckout;