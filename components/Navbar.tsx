
import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Shield, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onCartToggle: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ onCartToggle, onNavigate, currentPage }) => {
  const { cart } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const themeColor = 'text-red-600';
  const navBg = 'bg-black/90 text-white';

  const isAdmin = currentPage === 'admin';

  const navItems = [
    { label: 'Recorrido', id: 'home' },
    { label: 'Tienda', id: 'tienda' },
    { label: 'Registro Fotográfico', id: 'galeria' },
    { label: 'Próximos Eventos', id: 'torneos' },
    { label: 'Patrocinadores', id: 'patrocinadores', icon: Users, highlight: true },
  ];

  const handleNavClick = (item: any) => {
    onNavigate(item.id);
    if (item.section) {
      setTimeout(() => {
        const el = document.getElementById(item.section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 backdrop-blur-md ${navBg} border-b border-white/5`}>
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <span className={`text-2xl font-black italic tracking-tighter ${themeColor}`}>
              <img
                src="/img/logo-elite.png"
                alt="Elite Sports Urban Hub"
                className="h-20 md:h-22 xl:h-20 w-auto object-contain opacity-95 drop-shadow-2xl"
              />
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {isAdmin ? (
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-white hover:text-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-800"
              >
                <ShoppingCart size={16} className="rotate-180" /> Volver al Sitio Web
              </button>
            ) : (
              <>
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      item.highlight
                        ? 'flex items-center gap-1.5 rounded-xl bg-green-600/10 border border-green-600/30 text-green-400 hover:bg-green-600 hover:text-white'
                        : 'hover:text-red-600'
                    }`}
                  >
                    {item.icon && <item.icon size={14} />}
                    {item.label}
                  </button>
                ))}
                <div className="flex items-center gap-6 pl-6 border-l border-zinc-800">
                  <div className="relative cursor-pointer group" onClick={onCartToggle}>
                    <ShoppingCart size={20} className="hover:text-red-600 transition-colors" />
                    {cartCount > 0 && <span className="absolute -top-2 -right-2 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black bg-red-600">{cartCount}</span>}
                  </div>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
                  >
                    <Shield size={14} /> Panel Admin
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {!isAdmin && (
              <button onClick={onCartToggle} className="relative">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{cartCount}</span>}
              </button>
            )}
            {isAdmin ? (
              <button onClick={() => onNavigate('home')} className="text-zinc-500 hover:text-white p-2">
                <ShoppingCart size={24} className="rotate-180" />
              </button>
            ) : (
              <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X size={24} /> : <Menu size={24} />}</button>
            )}
          </div>
        </div>
      </div>

      {isOpen && !isAdmin && (
        <div className="md:hidden bg-black text-white p-6 space-y-4 border-b border-zinc-900 animate-in slide-in-from-top duration-300">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => handleNavClick(item)}
              className={`flex items-center gap-2 w-full text-left py-3 text-[11px] font-black uppercase tracking-widest border-b border-zinc-900 last:border-0 ${
                item.highlight ? 'text-green-400' : 'hover:text-red-600'
              }`}>
              {item.icon && <item.icon size={18} />}{item.label}
            </button>
          ))}
          <button
            onClick={() => { onNavigate('admin'); setIsOpen(false); }}
            className="flex items-center gap-2 w-full text-left py-4 text-[11px] font-black uppercase tracking-widest text-red-600"
          >
            <Shield size={16} /> Ir al Panel Admin
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
