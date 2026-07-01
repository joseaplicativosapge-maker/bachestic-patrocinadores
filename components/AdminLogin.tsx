
import React, { useState } from 'react';
import { Lock, Delete, ChevronLeft, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const { loginAdmin } = useApp(); // LOGIN ACA: Obtenemos la función del contexto
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // LOGIN ACA: Lógica que se dispara al ingresar los 4 dígitos
  const handleNumberClick = async (num: string) => {
    if (pin.length < 4 && !isVerifying) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setIsVerifying(true);
        // LOGIN ACA: Llamada asíncrona al servidor
        const result = await loginAdmin(newPin);
        
        if (result.success) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
            setIsVerifying(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    if (!isVerifying) setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <button 
        onClick={onCancel}
        className="absolute top-8 left-8 text-zinc-500 hover:text-white flex items-center gap-2 uppercase text-xs font-bold tracking-widest"
      >
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="max-w-xs w-full text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border transition-all duration-300 ${error ? 'border-red-600 animate-bounce' : isVerifying ? 'border-red-600' : 'border-zinc-800'}`}>
            {isVerifying ? (
              <Loader2 className="text-red-600 animate-spin" size={24} />
            ) : (
              <Lock className={error ? 'text-red-600' : 'text-red-600'} size={24} />
            )}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Acceso Admin</h2>
          <p className="text-zinc-500 text-xs mt-1 uppercase font-bold tracking-widest">
            {isVerifying ? 'Verificando PIN...' : error ? 'PIN incorrecto' : 'Ingresa el PIN de 4 dígitos'}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i ? 'bg-red-600 border-red-600 scale-125' : 'border-zinc-800'
              } ${error ? 'bg-red-900 border-red-900' : ''}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'].map((val, i) => (
            val === '' ? <div key={i} /> : (
              <button
                key={i}
                disabled={isVerifying}
                onClick={() => handleNumberClick(val)}
                className={`pin-button w-20 h-20 rounded-full bg-zinc-900 text-2xl font-black text-white flex items-center justify-center transition-all border border-zinc-800/50 ${isVerifying ? 'opacity-50' : 'hover:bg-zinc-800 active:scale-95'}`}
              >
                {val}
              </button>
            )
          ))}
          <button
            onClick={handleDelete}
            disabled={isVerifying}
            className="pin-button w-20 h-20 rounded-full bg-zinc-900/50 text-white flex items-center justify-center hover:bg-red-900/20 transition-all border border-zinc-800/50"
          >
            <Delete size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;