
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Link, Copy, DollarSign, ShoppingCart, Users, TrendingUp,
  LogOut, Mail, Lock, Activity, X,
  Package, Percent, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { SponsorStats, SponsorCommission, SponsorProductCommission } from '../types';

const SponsorMarketing: React.FC = () => {
  const {
    sponsorData, products,
    loginSponsor, logoutSponsor,
    getSponsorStats, getSponsorCommissions, getSponsorProductCommissions
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [stats, setStats] = useState<SponsorStats | null>(null);
  const [commissions, setCommissions] = useState<SponsorCommission[]>([]);
  const [productCommissions, setProductCommissions] = useState<SponsorProductCommission[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const sponsorLink = `${window.location.origin}/?ref=${sponsorData?.sponsor_code || ''}`;

  useEffect(() => {
    if (sponsorData) {
      loadDashboard();
    }
  }, [sponsorData]);

  const loadDashboard = async () => {
    if (!sponsorData) return;
    setStatsLoading(true);
    try {
      const [s, c, pc] = await Promise.all([
        getSponsorStats(sponsorData.sponsor_code),
        getSponsorCommissions(sponsorData.sponsor_code),
        getSponsorProductCommissions(sponsorData.sponsor_code),
      ]);
      setStats(s);
      setCommissions(Array.isArray(c) ? c : []);
      setProductCommissions(Array.isArray(pc) ? pc : []);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showMsg('Completá todos los campos', true);
    setLoading(true);
    const result = await loginSponsor(email, password);
    setLoading(false);
    if (result.success) {
      showMsg('Inicio de sesión exitoso');
    } else {
      showMsg(result.message || 'Error al iniciar sesión', true);
    }
  };

  const handleLogout = () => {
    logoutSponsor();
    setStats(null);
    setCommissions([]);
    setProductCommissions([]);
    setEmail('');
    setPassword('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showMsg('Link copiado al portapapeles');
    });
  };

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

  if (!sponsorData) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-md">
          {(error || success) && (
            <div className={`mb-6 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3
              ${error ? 'bg-red-600/20 border border-red-600 text-red-400' : 'bg-green-600/20 border border-green-600 text-green-400'}`}>
              {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {error || success}
            </div>
          )}

          <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto">
                <Users size={28} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                Patrocinadores
              </h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Ganá comisiones promocionando productos Elite
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-black border border-zinc-800 text-white pl-11 pr-4 py-4 rounded-xl text-sm outline-none focus:border-red-600 transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-zinc-800 text-white pl-11 pr-4 py-4 rounded-xl text-sm outline-none focus:border-red-600 transition-colors" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50">
                {loading ? <Activity className="animate-spin" size={16} /> : <LogOut size={16} />}
                Ingresar
              </button>
            </form>

            <p className="text-[9px] font-bold text-zinc-700 text-center">
              ¿Querés ser patrocinador? Contactanos por WhatsApp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 pt-28 pb-16">
      <div className="max-w-5xl mx-auto space-y-8">
        {(error || success) && (
          <div className={`px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3
            ${error ? 'bg-red-600/20 border border-red-600 text-red-400' : 'bg-green-600/20 border border-green-600 text-green-400'}`}>
            {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {error || success}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              Panel de Patrocinador
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
              {sponsorData?.name} · {sponsorData?.sponsor_code}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadDashboard}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-all">
              <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-all">
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Link size={20} className="text-red-600" />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tu link de patrocinador</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black border border-zinc-800 text-zinc-300 px-5 py-4 rounded-xl text-xs font-mono truncate">
              {sponsorLink}
            </code>
            <button onClick={() => copyToClipboard(sponsorLink)}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all active:scale-95">
              <Copy size={18} />
            </button>
          </div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            Compartí este link. Cuando alguien compre, vos ganás comisión.
          </p>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-zinc-600">
            <Activity className="animate-spin" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Cargando estadísticas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={18} className="text-blue-400" />
                </div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Ventas</p>
              </div>
              <p className="text-3xl font-black text-white">{stats?.total_orders ?? 0}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign size={18} className="text-green-400" />
                </div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Comisiones</p>
              </div>
              <p className="text-3xl font-black text-white">{formatCOP(stats?.total_commissions ?? 0)}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center">
                  <Percent size={18} className="text-red-400" />
                </div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Comisión base</p>
              </div>
              <p className="text-3xl font-black text-white">{stats?.commission_percent ?? sponsorData?.commission_percent}%</p>
            </div>
          </div>
        )}

        {productCommissions.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Package size={20} className="text-red-600" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tus comisiones por producto</p>
            </div>
            <div className="space-y-2">
              {productCommissions.map((pc, i) => (
                <div key={i} className="flex items-center justify-between bg-black border border-zinc-900 rounded-xl px-5 py-4">
                  <div>
                    <p className="text-white font-bold text-sm">{pc.name}</p>
                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">{formatCOP(pc.price)}</p>
                  </div>
                  <span className="px-4 py-2 bg-green-900/30 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {pc.commission_percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-red-600" />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Historial de comisiones ({commissions.length})
            </p>
          </div>
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
                <DollarSign size={28} className="text-zinc-700" />
              </div>
              <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Sin comisiones todavía</p>
              <p className="text-[10px] font-bold text-zinc-700 uppercase">
                Compartí tu link de patrocinador para empezar a ganar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[8px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-900">
                    <th className="pb-3 pr-4">Orden</th>
                    <th className="pb-3 pr-4">Producto</th>
                    <th className="pb-3 pr-4">Cant.</th>
                    <th className="pb-3 pr-4">Precio</th>
                    <th className="pb-3 pr-4">% Com.</th>
                    <th className="pb-3 pr-4">Comisión</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c, i) => (
                    <tr key={i} className="border-b border-zinc-900/50 text-xs">
                      <td className="py-3 pr-4 text-zinc-400 font-mono text-[10px]">{c.order_id}</td>
                      <td className="py-3 pr-4 text-white font-bold">{c.name}</td>
                      <td className="py-3 pr-4 text-zinc-400">{c.quantity}</td>
                      <td className="py-3 pr-4 text-zinc-400">{formatCOP(c.price)}</td>
                      <td className="py-3 pr-4 text-green-400 font-bold">{c.commission_percent}%</td>
                      <td className="py-3 pr-4 text-green-400 font-bold">{formatCOP(c.commission_amount)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest
                          ${c.status === 'PAGADO' ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-red-600" />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Productos disponibles ({products.length})
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.slice(0, 12).map(product => (
              <div key={product.id} className="bg-black border border-zinc-900 rounded-xl p-4 flex items-start gap-3">
                <img src={product.image} alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-zinc-900" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-xs truncate">{product.name}</p>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">{formatCOP(product.price)}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest bg-red-900/30 text-red-400">
                    ELITE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorMarketing;
