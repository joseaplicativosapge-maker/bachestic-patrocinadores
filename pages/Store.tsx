
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { ShoppingCart } from 'lucide-react';

const Store: React.FC = () => {
  const { products, addToCart } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const themeColor = 'text-red-600';
  const bgMain = 'bg-black text-white';
  const API_BASE = import.meta.env.VITE_API_BASE + '/api';

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(
          data.filter((c: any) =>
            c.segment === 'elite' || c.segment === 'both'
          )
        );
      })
      .catch(err => console.error(err));
  }, []);

  const filteredProducts = products.filter(
    p =>
      p.segment === 'elite' &&
      (activeCategory === 'Todos' || p.category === activeCategory)
  );

  const handleAddToCart = (p: Product) => {
    if (p.stock <= 0) return;
    const size = p.sizes.length === 1 ? p.sizes[0] : selectedSize;
    if (p.sizes.length > 1 && !size) return;
    addToCart(p, size, quantity);
    setSelectedProduct(null);
    setSelectedSize('');
    setQuantity(1);
  };

  const canAddToCart =
    selectedProduct &&
    selectedProduct.stock > 0 &&
    (selectedProduct.sizes.length === 1 || selectedSize !== '');

  return (
    <div className={`min-h-screen ${bgMain} px-6 md:px-8 pt-28 pb-16`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-12 text-white">
          ELITE <span className={themeColor}>STORE</span>
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={() => { setActiveCategory('Todos'); setSelectedProduct(null); }}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
              activeCategory === 'Todos' ? `bg-red-600 border-red-600 text-white` : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id || cat.key_name}
              onClick={() => { setActiveCategory(cat.label || cat.key_name); setSelectedProduct(null); }}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                activeCategory === cat.label || activeCategory === cat.key_name
                  ? `bg-red-600 border-red-600 text-white`
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.label || cat.key_name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="group bg-zinc-950 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-red-600 transition-all cursor-pointer"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {p.stock <= 5 && p.stock > 0 && (
                  <span className="absolute top-3 right-3 bg-yellow-600/90 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase">
                    Últimas {p.stock}
                  </span>
                )}
                {p.stock === 0 && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <span className="text-white font-black text-sm uppercase italic -rotate-12 border-2 border-red-600 px-4 py-1 rounded-lg">Agotado</span>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-2">
                <p className="text-white font-black text-sm uppercase leading-tight">{p.name}</p>
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">{p.category}</p>
                <p className="text-red-600 font-black text-xl">
                  ${Number(p.price).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <ShoppingCart size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-600 font-black text-sm uppercase tracking-widest">No hay productos en esta categoría</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-video rounded-t-[3rem] overflow-hidden">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase">{selectedProduct.name}</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{selectedProduct.category}</p>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed">{selectedProduct.description}</p>

              <div className="flex items-center gap-4">
                <span className="text-3xl font-black text-red-600">${Number(selectedProduct.price).toLocaleString('es-CO')}</span>
                {selectedProduct.stock > 0 ? (
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${selectedProduct.stock <= 5 ? 'bg-yellow-600/20 text-yellow-500' : 'bg-green-600/20 text-green-400'}`}>
                    {selectedProduct.stock} disponibles
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-600/20 text-red-400">Agotado</span>
                )}
              </div>

              {selectedProduct.sizes.length > 1 && (
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Talle</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${
                          selectedSize === size ? 'bg-red-600 border-red-600 text-white' : 'bg-black border-zinc-800 text-zinc-400 hover:border-red-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cantidad</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-black border border-zinc-800 rounded-xl text-white font-black text-lg hover:border-red-600 transition-all">-</button>
                  <span className="text-xl font-black text-white w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))} className="w-12 h-12 bg-black border border-zinc-800 rounded-xl text-white font-black text-lg hover:border-red-600 transition-all">+</button>
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(selectedProduct)}
                disabled={!canAddToCart}
                className="w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {!canAddToCart ? 'Seleccioná talle' : 'Agregar al Carrito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;
