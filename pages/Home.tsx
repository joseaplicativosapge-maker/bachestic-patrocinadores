
import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Trophy, Star, TrendingUp, Users, ChevronDown, ShoppingBag, Zap } from 'lucide-react';

const Home: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { settings, products } = useApp();

  const productsToShow = products.filter(p => p.segment === 'elite').slice(0, 4);

  const photoTrayectoriaElite =
    settings.photoTrayectoriaElite ||
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="w-full transition-colors duration-700 bg-[#0a0a0a] mt-10">
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={settings.heroElite || "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=1600"}
            className="w-full h-full object-cover opacity-30 scale-105"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-red-600/30 bg-red-600/5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.5em] text-red-400">
                    Temporada 2026
                  </span>
                </div>

                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[110px] xl:text-[140px] font-black italic tracking-tighter leading-[0.85]">
                  <span className="text-white block">ELITE</span>
                  <span className="relative inline-block">
                    <span className="text-red-600">SPORTS</span>
                    <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-gradient-to-r from-red-600 to-transparent rounded-full" />
                  </span>
                  <span className="text-white block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mt-2">
                    URBAN HUB
                  </span>
                </h1>
              </div>

              <p className="text-base md:text-lg text-zinc-400 max-w-lg leading-relaxed font-medium">
                Donde el estilo urbano se encuentra con el alto rendimiento. 
                Vestimos a los que transforman cada cancha en su escenario 
                y cada entrenamiento en un paso hacia la gloria.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => onNavigate('tienda')}
                  className="group px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-red-900/40"
                >
                  <ShoppingBag size={18} />
                  Tienda
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('patrocinadores')}
                  className="group px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-zinc-700/50 text-white hover:bg-white/5 hover:border-red-600/50 active:scale-95 transition-all flex items-center gap-3 backdrop-blur-sm"
                >
                  <Zap size={18} className="text-green-400" />
                  Ser Patrocinador
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-green-400" />
                </button>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-[3rem] opacity-20 blur-xl" />
                <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
                  <img
                    src={settings.photoTrayectoriaElite || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                    alt="Elite"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white font-black text-sm uppercase tracking-widest">Colección 2026</p>
                    <p className="text-red-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Disponible ahora</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '500+', label: 'Atletas' },
                  { value: '12', label: 'Torneos' },
                  { value: '3', label: 'Países' },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 text-center backdrop-blur-sm hover:border-red-600/30 transition-colors">
                    <span className="text-2xl md:text-3xl font-black italic text-white block">{stat.value}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20 lg:mt-16 flex justify-center">
            <button
              onClick={() => {
                const el = document.getElementById('recorrido');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center gap-2 text-zinc-600 hover:text-red-600 transition-colors group"
            >
              <span className="text-[8px] font-black uppercase tracking-[0.5em]">Deslizá</span>
              <ChevronDown size={20} className="animate-bounce group-hover:animate-none" />
            </button>
          </div>
        </div>
      </section>

      <section id="recorrido" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-3 mb-8">
              <span className="h-[2px] w-8 bg-red-600" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Trayectoria</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-8 leading-none text-white">
              FORJANDO<br />
              <span className="text-red-600">LEYENDAS</span>
            </h2>
            <p className="text-xl leading-relaxed mb-10 font-medium text-zinc-400">
              {settings.historyElite || 'Desde nuestros inicios en las canchas locales hasta convertirnos en referentes del deporte urbano. Cada puntada, cada diseño y cada evento llevan la marca de quienes nunca se conforman.'}
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl border bg-zinc-900/50 border-zinc-800 text-center">
                <span className="text-3xl font-black italic block mb-1 text-white">{settings.statYear || '2015'}</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Fundación</span>
              </div>
              <div className="p-5 rounded-2xl border bg-zinc-900/50 border-zinc-800 text-center">
                <span className="text-3xl font-black italic block mb-1 text-white">
                  {settings.statEliteEvents || '50+'}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Eventos</span>
              </div>
              <div className="p-5 rounded-2xl border bg-zinc-900/50 border-zinc-800 text-center">
                <span className="text-3xl font-black italic block mb-1 text-white">
                  {settings.statCollections || '30+'}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Colecciones</span>
              </div>
            </div>
          </div>

          <div className="relative group order-1 md:order-2">
            <div className="absolute -inset-6 rounded-[5rem] opacity-20 transition-all group-hover:opacity-40 blur-3xl bg-red-600" />
            <div className="relative aspect-[4/5] rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={photoTrayectoriaElite}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
                alt="Trayectoria Elite"
              />
            </div>
          </div>
        </div>
      </section>

      {productsToShow.length > 0 && (
        <section className="py-32 px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 px-4">
              <div>
                <div className="inline-flex items-center gap-3 mb-4">
                  <span className="h-[2px] w-8 bg-red-600" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Equipamiento</span>
                </div>
                <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
                  COLECCIÓN <span className="text-red-600">ELITE</span>
                </h3>
              </div>
              <button onClick={() => onNavigate('tienda')} className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors mt-4 md:mt-0">
                VER CATÁLOGO COMPLETO <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {productsToShow.map(p => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('tienda')}
                  className="cursor-pointer group p-5 rounded-[2.5rem] transition-all hover:-translate-y-2 border bg-zinc-900/50 border-zinc-800 hover:border-red-600"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[2rem] mb-6">
                    <img
                      src={p.image}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={p.name}
                    />
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-4 py-1 text-[9px] font-black uppercase tracking-widest rounded-full backdrop-blur-md shadow-lg ${
                          p.stock > 5
                            ? 'bg-green-600/80 text-white'
                            : p.stock > 0
                            ? 'bg-yellow-500/90 text-black'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
                      </span>
                    </div>
                    {p.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <span className="text-white font-black text-lg uppercase italic -rotate-12 border-2 border-red-600 px-4 py-1 rounded-lg">Agotado</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-black uppercase text-[10px] italic mb-2 text-white">{p.name}</h4>
                  <span className="font-black text-2xl text-red-600">${Number(p.price).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-32 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-green-600/5" />

          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-green-600/10 mb-4">
              <TrendingUp size={36} className="text-green-400" />
            </div>

            <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
              PROGRAMA DE<br />
              <span className="text-green-400">PATROCINADORES</span>
            </h3>

            <p className="text-lg leading-relaxed text-zinc-400 max-w-2xl mx-auto">
              Convertite en patrocinador Elite y ganá comisiones por cada venta que generes.
              Recibí tu link único, compartilo con tu comunidad y empezá a rentabilizar tu influencia.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { icon: <Users size={20} className="text-green-400" />, title: 'Link único', desc: 'Recibí tu código personal de patrocinador' },
                { icon: <TrendingUp size={20} className="text-green-400" />, title: 'Comisiones', desc: 'Ganá un porcentaje por cada venta concretada' },
                { icon: <Star size={20} className="text-green-400" />, title: 'Dashboard', desc: 'Seguí tus ventas y comisiones en tiempo real' },
              ].map((item, i) => (
                <div key={i} className="bg-black/50 border border-zinc-800 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    {item.icon}
                  </div>
                  <p className="text-white font-black text-xs uppercase tracking-widest mb-1">{item.title}</p>
                  <p className="text-zinc-500 text-[10px] font-bold">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => onNavigate('patrocinadores')}
                className="px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest bg-green-600 text-white hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-900/30"
              >
                ACCEDER AL PANEL
              </button>
              <a
                href="https://wa.me/573228942867"
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-zinc-700 text-white hover:bg-white hover:text-black transition-all text-center"
              >
                QUIERO SER PATROCINADOR
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ChevronRight = ({size}: {size: number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

export default Home;
