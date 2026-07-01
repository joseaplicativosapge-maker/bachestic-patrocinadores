import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Home, ShoppingBag, ArrowRight } from 'lucide-react';

interface PaymentResultProps {
  onNavigate: (page: string) => void;
}

const PaymentResult: React.FC<PaymentResultProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<'loading' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'unknown'>('loading');
  const [reference, setReference] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txId = params.get('id') ?? '';

    setTransactionId(txId);

    if (!txId) {
        setStatus('unknown');
        setTimeout(() => setVisible(true), 100);
        return;
    }

    // Consultar estado real al backend
    fetch(`${import.meta.env.VITE_API_BASE}/api/wompi/transaction/${txId}`)
        .then(res => res.json())
        .then(data => {
        const txStatus = (data.status ?? '').toUpperCase();
        if (['APPROVED', 'DECLINED', 'VOIDED'].includes(txStatus)) {
            setStatus(txStatus as any);
        } else {
            setStatus('unknown');
        }
        if (data.reference) setReference(data.reference);
        })
        .catch(() => setStatus('unknown'))
        .finally(() => setTimeout(() => setVisible(true), 100));
    }, []);

  const handleGoToStore = () => {
    window.history.replaceState({}, '', '/');
    onNavigate('tienda');
  };

  const handleGoHome = () => {
    window.history.replaceState({}, '', '/');
    onNavigate('home');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-red-600 animate-spin" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            Verificando tu pago...
          </p>
        </div>
      </div>
    );
  }

  const config = {
    APPROVED: {
      icon: <CheckCircle2 size={72} strokeWidth={1.2} className="text-green-400" />,
      ringColor: 'ring-green-500/20',
      iconBg: 'bg-green-500/10',
      accentColor: 'bg-green-500',
      border: 'border-green-500/15',
      cardBg: 'bg-green-500/[0.03]',
      badge: 'bg-green-500/10 text-green-400 border-green-500/20',
      badgeText: '✓ Pago Aprobado',
      title: '¡Gracias por tu compra!',
      subtitle: 'Tu pedido está confirmado',
      message: 'Recibirás un comprobante en tu correo electrónico. Tu pedido será procesado pronto.',
      titleColor: 'text-white',
      showRetry: false,
      primaryBtn: 'Seguir Comprando',
      primaryIcon: <ShoppingBag size={15} />,
    },
    DECLINED: {
      icon: <XCircle size={72} strokeWidth={1.2} className="text-red-400" />,
      ringColor: 'ring-red-500/20',
      iconBg: 'bg-red-500/10',
      accentColor: 'bg-red-600',
      border: 'border-red-500/15',
      cardBg: 'bg-red-500/[0.03]',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
      badgeText: '✕ Pago Rechazado',
      title: 'No se pudo procesar',
      subtitle: 'Tu pago fue rechazado',
      message: 'Verifica los datos de tu tarjeta e intenta de nuevo, o usa otro método de pago.',
      titleColor: 'text-red-400',
      showRetry: true,
      primaryBtn: 'Intentar de Nuevo',
      primaryIcon: <ArrowRight size={15} />,
    },
    VOIDED: {
      icon: <AlertCircle size={72} strokeWidth={1.2} className="text-amber-400" />,
      ringColor: 'ring-amber-500/20',
      iconBg: 'bg-amber-500/10',
      accentColor: 'bg-amber-500',
      border: 'border-amber-500/15',
      cardBg: 'bg-amber-500/[0.03]',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badgeText: '○ Pago Cancelado',
      title: 'Transacción cancelada',
      subtitle: 'No se realizó ningún cobro',
      message: 'Cancelaste el proceso. Tu carrito sigue disponible cuando quieras retomar.',
      titleColor: 'text-amber-400',
      showRetry: true,
      primaryBtn: 'Volver a la Tienda',
      primaryIcon: <ShoppingBag size={15} />,
    },
    unknown: {
      icon: <AlertCircle size={72} strokeWidth={1.2} className="text-zinc-400" />,
      ringColor: 'ring-zinc-700',
      iconBg: 'bg-zinc-800',
      accentColor: 'bg-zinc-600',
      border: 'border-zinc-700/50',
      cardBg: 'bg-zinc-800/20',
      badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      badgeText: '? Estado Desconocido',
      title: 'No pudimos verificar',
      subtitle: 'Estado del pago incierto',
      message: 'Si fuiste cobrado, contáctanos por WhatsApp con tu referencia y lo resolvemos.',
      titleColor: 'text-zinc-300',
      showRetry: true,
      primaryBtn: 'Ir a la Tienda',
      primaryIcon: <ShoppingBag size={15} />,
    },
  };

  const c = config[status];

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4 pt-28 pb-12">

      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 transition-all duration-1000 ${
            status === 'APPROVED' ? 'bg-green-500' :
            status === 'DECLINED' ? 'bg-red-600' :
            status === 'VOIDED'   ? 'bg-amber-500' : 'bg-zinc-600'
          }`}
        />
      </div>

      <div
        className={`
          relative w-full max-w-sm transition-all duration-700
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        {/* Línea de acento superior */}
        <div className={`h-0.5 w-full ${c.accentColor} rounded-full mb-6 opacity-60`} />

        {/* Card principal */}
        <div className={`border ${c.border} ${c.cardBg} rounded-3xl overflow-hidden`}>

          {/* Header con ícono */}
          <div className="px-8 pt-10 pb-6 text-center space-y-5">
            {/* Ícono */}
            <div className={`w-24 h-24 ${c.iconBg} ring-1 ${c.ringColor} rounded-full flex items-center justify-center mx-auto`}>
              {c.icon}
            </div>

            {/* Badge */}
            <span className={`inline-block text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${c.badge}`}>
              {c.badgeText}
            </span>

            {/* Títulos */}
            <div className="space-y-1">
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                {c.subtitle}
              </p>
              <h1 className={`text-2xl font-black uppercase tracking-tight leading-tight ${c.titleColor}`}>
                {c.title}
              </h1>
            </div>

            {/* Mensaje */}
            <p className="text-zinc-500 text-[11px] font-bold leading-relaxed">
              {c.message}
            </p>
          </div>

          {/* Datos de la transacción */}
          {(reference || transactionId) && (
            <div className="mx-6 mb-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
              {reference && (
                <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-800/60">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                    Referencia
                  </span>
                  <span className="text-[10px] font-black text-zinc-300 font-mono">
                    {reference}
                  </span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                    ID Transacción
                  </span>
                  <span className="text-[10px] font-black text-zinc-300 font-mono">
                    #{transactionId}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="px-6 pb-8 space-y-3">
            <button
              onClick={handleGoToStore}
              className={`
                w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px]
                transition-all duration-200 active:scale-95 flex items-center justify-center gap-2
                shadow-lg ${c.accentColor}
                ${status === 'APPROVED' ? 'hover:brightness-110' : 'hover:brightness-110'}
              `}
            >
              {c.primaryIcon}
              {c.primaryBtn}
            </button>

            <button
              onClick={handleGoHome}
              className="w-full bg-transparent hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Home size={14} />
              Ir al Inicio
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-[8px] font-black uppercase tracking-widest mt-6">
          Pagos seguros · Wompi · Grupo Cibest
        </p>
      </div>
    </div>
  );
};

export default PaymentResult;