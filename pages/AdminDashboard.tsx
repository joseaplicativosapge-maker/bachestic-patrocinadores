import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, ShoppingBag, Calendar as CalendarIcon, Users, Settings, Package,
  Trash2, Plus, Image as ImageIcon, X, Edit3, Wallet, Zap, Trophy, Activity, Upload,
  UserPlus, Shield, LogOut, PlusCircle, AlertTriangle, Star, Mail,
  Phone as PhoneIcon, User as UserIcon, GraduationCap, UsersRound, ChevronRight,
  ChevronLeft, FileImage, Tag, Save, CheckCircle2, Images, FolderOpen,
  ToggleLeft, ToggleRight, GripVertical, ChevronUp, ChevronDown, Search, Percent,
} from 'lucide-react';
import { EliteEvent, Product, ProductCategory, AdminUser, Order } from '../types';

interface AdminDashboardProps {
  onLogout?: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE + '/api';

interface DynCategory {
  id: number;
  key_name: string;
  label: string;
  description?: string;
  icon?: string;
  segment: 'elite' | 'both';
  active: boolean | number;
  sort_order: number;
}

interface GalleryProject {
  id: number;
  name: string;
  description?: string;
  cover_image?: string;
  images: { id: number; url: string; image?: string; project_id?: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS REUTILIZABLES
// ─────────────────────────────────────────────────────────────────────────────

function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  
  // Clamp la página si queda fuera de rango (ej. al filtrar)
  const safePage = Math.min(page, totalPages);
  const paginated = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  
  return { page: safePage, setPage, totalPages, paginated, total: items.length };
}

const Pagination: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}> = ({ page, totalPages, total, pageSize, onPage }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '...')[]>((acc, p, idx, arr) => {
            if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-2 text-zinc-700 text-[9px] font-black">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={`w-8 h-8 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all
                  ${page === p ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Buscar...' }) => (
  <div className="relative">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl outline-none focus:border-red-600 transition-colors placeholder:text-zinc-700 w-full md:w-56"
    />
    {value && (
      <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
        <X size={12} />
      </button>
    )}
  </div>
);

const PAGE_SIZE = 8;

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC CATEGORIES HOOK
// ─────────────────────────────────────────────────────────────────────────────

function useDynCategories() {
  const [categories, setCategories] = useState<DynCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { categories, loading, reload: load };
}

const SEGMENT_OPTIONS = [
  { value: 'both', label: 'Ambos', color: 'bg-zinc-700 text-zinc-200' },
  { value: 'elite', label: 'Elite', color: 'bg-red-900  text-red-300' },
] as const;

const COMMON_EMOJIS = ['🏆', '🏙️', '⚡', '🤝', '👕', '🎽', '🧢', '👟', '🎯', '🔥', '⭐', '💪', '🏅', '🎁', '🛍️', '🏷️'];

const emptyForm = (): Partial<DynCategory> => ({
  key_name: '', label: '', description: '', icon: '🏷️', segment: 'elite', active: true, sort_order: 0,
});

const SegmentBadge: React.FC<{ segment: string }> = ({ segment }) => {
  const opt = SEGMENT_OPTIONS.find(o => o.value === segment);
  return (
    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${opt?.color ?? 'bg-zinc-800 text-zinc-400'}`}>
      {opt?.label ?? segment}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES MANAGER
// ─────────────────────────────────────────────────────────────────────────────

const CategoriesManager: React.FC = () => {
  const { categories, loading, reload } = useDynCategories();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<DynCategory>>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [search, setSearch] = useState('');

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  };

  const generateKey = (label: string) =>
    label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label?.trim()) return showMsg('El nombre es requerido', true);
    setSaving(true);
    try {
      const payload = {
        ...form,
        key_name: form.key_name?.trim() || generateKey(form.label!),
        active: form.active ? 1 : 0,
      };
      const url = editingId ? `${API_BASE}/categories/${editingId}` : `${API_BASE}/categories`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return showMsg(data.error || 'Error al guardar', true);
      showMsg(editingId ? '✓ Categoría actualizada' : '✓ Categoría creada');
      setShowForm(false); setEditingId(null); setForm(emptyForm()); reload();
    } catch { showMsg('Error de conexión', true); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (cat: DynCategory) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: cat.active ? 0 : 1 }),
      });
      if (!res.ok) return showMsg('Error al cambiar estado', true);
      reload();
    } catch { showMsg('Error de conexión', true); }
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(c => c.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newOrder = [...sorted];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    const items = newOrder.map((c, i) => ({ id: c.id, sort_order: i }));
    try {
      await fetch(`${API_BASE}/categories/reorder`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }),
      });
      reload();
    } catch { showMsg('Error al reordenar', true); }
  };

  const openEdit = (cat: DynCategory) => {
    setForm({ ...cat, active: Boolean(cat.active) });
    setEditingId(cat.id); setShowForm(true); setShowEmojiPicker(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm()); setShowEmojiPicker(false); };

  const filtered = useMemo(() => {
    return [...categories]
      .filter(c => {
        if (filterSegment !== 'all' && c.segment !== filterSegment && c.segment !== 'both') return false;
        if (filterActive === 'active' && !c.active) return false;
        if (filterActive === 'inactive' && c.active) return false;
        if (search) {
          const q = search.toLowerCase();
          return c.label.toLowerCase().includes(q) || c.key_name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, filterSegment, filterActive, search]);

  const { page, setPage, totalPages, paginated, total } = usePagination(filtered, PAGE_SIZE);

  return (
    <div className="space-y-8">
      {(error || success) && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3
          ${error ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {error || success}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Categorías</h2>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
            {categories.length} categoría{categories.length !== 1 ? 's' : ''} · {categories.filter(c => c.active).length} activa{categories.filter(c => c.active).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { cancelForm(); setShowForm(v => !v); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95
            ${showForm && !editingId ? 'bg-zinc-800 text-zinc-400' : 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-900/30'}`}>
          {showForm && !editingId ? <><X size={16} />Cancelar</> : <><Plus size={16} />Nueva Categoría</>}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-zinc-950 border border-zinc-900 rounded-2xl p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoría..." />
        <div className="flex gap-1 bg-black border border-zinc-900 rounded-xl p-1">
          {[{ value: 'all', label: 'Todos' }, ...SEGMENT_OPTIONS].map(opt => (
            <button key={opt.value} onClick={() => setFilterSegment(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                ${filterSegment === opt.value ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-black border border-zinc-900 rounded-xl p-1">
          {[{ value: 'all', label: 'Todas' }, { value: 'active', label: 'Activas' }, { value: 'inactive', label: 'Inactivas' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterActive(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                ${filterActive === opt.value ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {(search || filterSegment !== 'all' || filterActive !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterSegment('all'); setFilterActive('all'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors border border-zinc-800">
            <X size={11} />Limpiar
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">
            {editingId ? '✏️ Editando categoría' : '➕ Nueva categoría'}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Nombre *</label>
              <input required placeholder="Ej: Oficial, Urbano..." value={form.label || ''}
                onChange={e => setForm(prev => ({
                  ...prev, label: e.target.value,
                  key_name: editingId ? prev.key_name : generateKey(e.target.value),
                }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm font-bold outline-none focus:border-red-600 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">
                Clave interna (slug) <span className="text-zinc-700 normal-case font-bold ml-1">Auto-generado</span>
              </label>
              <input required placeholder="ej: oficial_elite" value={form.key_name || ''}
                onChange={e => setForm(prev => ({ ...prev, key_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                className="w-full bg-black border border-zinc-800 text-zinc-400 p-4 rounded-xl text-sm font-mono outline-none focus:border-red-600 transition-colors" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Descripción</label>
              <input placeholder="Descripción corta (opcional)" value={form.description || ''}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm outline-none focus:border-red-600 transition-colors" />
            </div>
            <div className="space-y-2 relative">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Icono (emoji)</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEmojiPicker(v => !v)}
                  className="flex items-center gap-2 px-4 py-4 bg-black border border-zinc-800 rounded-xl text-2xl hover:border-red-600 transition-colors">
                  {form.icon || '🏷️'}
                </button>
                <input placeholder="🏷️" value={form.icon || ''} maxLength={4}
                  onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="flex-1 bg-black border border-zinc-800 text-white p-4 rounded-xl text-lg outline-none focus:border-red-600 transition-colors" />
              </div>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 z-10 shadow-2xl">
                  <div className="grid grid-cols-8 gap-1">
                    {COMMON_EMOJIS.map(emoji => (
                      <button key={emoji} type="button"
                        onClick={() => { setForm(prev => ({ ...prev, icon: emoji })); setShowEmojiPicker(false); }}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-zinc-800 rounded-xl transition-colors">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Segmento</label>
              <div className="flex gap-2">
                {SEGMENT_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(prev => ({ ...prev, segment: opt.value as any }))}
                    className={`flex-1 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border-2
                      ${form.segment === opt.value ? 'border-red-600 bg-red-600/10 text-white' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Orden</label>
              <input type="number" min={0} value={form.sort_order ?? 0}
                onChange={e => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm outline-none focus:border-red-600 transition-colors" />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Estado</label>
              <button type="button" onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all
                  ${form.active ? 'border-green-600 bg-green-600/10 text-green-400' : 'border-zinc-700 bg-zinc-900 text-zinc-500'}`}>
                {form.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                {form.active ? 'Activa' : 'Inactiva'}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-zinc-900">
            <button type="button" onClick={cancelForm}
              className="flex-1 bg-zinc-900 text-zinc-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2
                ${saving ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>
              {saving
                ? <><Activity className="animate-spin" size={16} />Guardando...</>
                : <><Save size={16} />{editingId ? 'Actualizar' : 'Crear Categoría'}</>}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-zinc-600">
          <Activity className="animate-spin" size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Cargando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
            <Tag size={28} className="text-zinc-700" />
          </div>
          <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Sin resultados</p>
          <p className="text-[10px] font-bold text-zinc-700 uppercase">Prueba otros filtros o crea una nueva categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((cat, idx) => {
            const globalIdx = (page - 1) * PAGE_SIZE + idx;
            return (
              <div key={cat.id}
                className={`group bg-zinc-950 border rounded-[1.5rem] p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all
                  ${cat.active ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900 opacity-60'}`}>
                <div className="flex md:flex-col items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleReorder(cat.id, 'up')} disabled={globalIdx === 0}
                    className="p-1.5 text-zinc-700 hover:text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-20">
                    <ChevronUp size={14} />
                  </button>
                  <GripVertical size={16} className="text-zinc-700" />
                  <button onClick={() => handleReorder(cat.id, 'down')} disabled={globalIdx === filtered.length - 1}
                    className="p-1.5 text-zinc-700 hover:text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-20">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                  {cat.icon || '🏷️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-white font-black uppercase tracking-tight text-base">{cat.label}</p>
                    <SegmentBadge segment={cat.segment} />
                    {!cat.active && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500">Inactiva</span>
                    )}
                  </div>
                  {cat.description && <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest truncate">{cat.description}</p>}
                  <p className="text-zinc-700 text-[9px] font-mono mt-1">key: {cat.key_name}</p>
                </div>
                <div className="hidden md:flex items-center justify-center w-10 h-10 bg-zinc-900 rounded-xl">
                  <span className="text-[10px] font-black text-zinc-500">#{globalIdx + 1}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggleActive(cat)} title={cat.active ? 'Desactivar' : 'Activar'}
                    className={`p-3 rounded-2xl transition-all ${cat.active ? 'bg-green-900/30 text-green-500 hover:bg-green-900/50' : 'bg-zinc-900 text-zinc-600 hover:text-white'}`}>
                    {cat.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => openEdit(cat)}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl transition-all">
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 text-[9px] font-bold text-zinc-600 uppercase tracking-widest space-y-1">
        <p className="text-zinc-500 font-black">💡 Integración con Tienda</p>
        <p>El campo <span className="text-red-500">key_name</span> de cada categoría activa aparece automáticamente en el selector al crear productos.</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY MANAGER
// ─────────────────────────────────────────────────────────────────────────────

const GalleryManager: React.FC<{
  galleryImages: any[];
  deleteGalleryImage: (id: number) => void;
  addGalleryImage: (base64: string, projectId?: number) => Promise<void>;
}> = ({ galleryImages, deleteGalleryImage, addGalleryImage }) => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [openProject, setOpenProject] = useState<GalleryProject | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const unassigned = galleryImages.filter((img: any) =>
    !projects.some(p => p.images?.some(i => i.id === img.id))
  );

  const loadProjects = useCallback(async (): Promise<GalleryProject[]> => {
    try {
      const res = await fetch(`${API_BASE}/gallery/projects`);
      const data: GalleryProject[] = await res.json();
      setProjects(data);
      return data;
    } catch (e) { console.error(e); return []; }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const syncOpenProject = useCallback(async (current: GalleryProject | null) => {
    if (!current) return;
    const fresh = await loadProjects();
    if (current.id === -1) {
      const assignedIds = new Set(fresh.flatMap(p => p.images?.map(i => i.id) ?? []));
      const freshUnassigned = galleryImages.filter((img: any) => !assignedIds.has(img.id));
      setOpenProject({ id: -1, name: 'Sin categoría', description: 'Fotos sin proyecto asignado', images: freshUnassigned });
    } else {
      const refreshed = fresh.find(p => p.id === current.id);
      setOpenProject(refreshed ?? null);
    }
  }, [loadProjects, galleryImages]);

  useEffect(() => {
    if (!openProject) return;
    const images = openProject.images;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenProject(null);
      if (e.key === 'ArrowRight') setCarouselIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setCarouselIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openProject]);

  useEffect(() => {
    const len = openProject?.images.length ?? 0;
    if (len > 0 && carouselIndex >= len) setCarouselIndex(len - 1);
  }, [openProject?.images.length, carouselIndex]);

  const handleOpenProject = (project: GalleryProject) => { setOpenProject(project); setCarouselIndex(0); setAssigningId(null); };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await fetch(`${API_BASE}/gallery/projects`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
    });
    setNewProjectName(''); setNewProjectDesc(''); setIsAddingProject(false);
    await loadProjects();
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('¿Eliminar proyecto? Las fotos quedarán sin proyecto.')) return;
    await fetch(`${API_BASE}/gallery/projects/${id}`, { method: 'DELETE' });
    if (openProject?.id === id) setOpenProject(null);
    await loadProjects();
  };

  const handleRenameProject = async (id: number) => {
    if (!editingProjectName.trim()) return;
    await fetch(`${API_BASE}/gallery/projects/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingProjectName }),
    });
    setOpenProject(prev => prev && prev.id === id ? { ...prev, name: editingProjectName } : prev);
    setEditingProjectId(null); setEditingProjectName('');
    await loadProjects();
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, projectId?: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const targetProjectId = projectId ?? (openProject && openProject.id !== -1 ? openProject.id : undefined);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const base64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        await addGalleryImage(base64, targetProjectId);
      }
      await syncOpenProject(openProject);
    } finally { setUploading(false); e.target.value = ''; }
  };

  const handleAssignProject = async (imageId: number, projectId: number | null) => {
    await fetch(`${API_BASE}/gallery/${imageId}/project`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    });
    setAssigningId(null);
    await syncOpenProject(openProject);
  };

  const handleDeleteImage = async (id: number) => {
    if (!confirm('¿Eliminar foto?')) return;
    deleteGalleryImage(id);
    if (openProject) {
      const newImages = openProject.images.filter(img => img.id !== id);
      setOpenProject(prev => prev ? { ...prev, images: newImages } : null);
    }
    await loadProjects();
  };

  const getCover = (project: GalleryProject) =>
    project.cover_image || project.images?.[0]?.url || project.images?.[0]?.image || '';

  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }, [projects, projectSearch]);

  const projectsWithPhotos = filteredProjects.filter(p => p.images?.length > 0);
  const hasUnassigned = unassigned.length > 0;
  const totalImages = galleryImages.length;
  const currentImages = openProject?.images ?? [];
  const currentImg = currentImages[carouselIndex];

  return (
    <div className="space-y-6">
      {openProject && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col" onClick={() => setOpenProject(null)}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <button onClick={() => setOpenProject(null)} className="p-2 bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white rounded-xl transition-all"><X size={16} /></button>
              {editingProjectId === openProject.id ? (
                <div className="flex items-center gap-2">
                  <input autoFocus value={editingProjectName} onChange={e => setEditingProjectName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameProject(openProject.id);
                      if (e.key === 'Escape') { setEditingProjectId(null); setEditingProjectName(''); }
                    }}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-black border border-red-600 text-white outline-none w-48"
                    onClick={e => e.stopPropagation()} />
                  <button onClick={() => handleRenameProject(openProject.id)} className="p-1.5 bg-red-600 text-white rounded-lg"><Save size={12} /></button>
                  <button onClick={() => { setEditingProjectId(null); setEditingProjectName(''); }} className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg"><X size={12} /></button>
                </div>
              ) : (
                <div>
                  <p className="text-white font-black uppercase tracking-widest text-sm">{openProject.name}</p>
                  {openProject.description && <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{openProject.description}</p>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <UploadWithProjectSelector projects={projects} defaultProjectId={openProject.id === -1 ? undefined : openProject.id} uploading={uploading} onUpload={handleUploadPhoto} />
              {openProject.id !== -1 && (
                <>
                  <button onClick={() => { setEditingProjectId(openProject.id); setEditingProjectName(openProject.name); }} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"><Edit3 size={14} /></button>
                  <button onClick={() => handleDeleteProject(openProject.id)} className="p-2 bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white rounded-xl transition-all"><Trash2 size={14} /></button>
                </>
              )}
            </div>
          </div>
          {currentImages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6" onClick={e => e.stopPropagation()}>
              <FileImage size={48} className="text-zinc-700" />
              <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Sin fotos en este proyecto</p>
              <UploadWithProjectSelector projects={projects} defaultProjectId={openProject.id === -1 ? undefined : openProject.id} uploading={uploading} onUpload={handleUploadPhoto} large />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center px-20 relative" onClick={e => e.stopPropagation()}>
              {carouselIndex > 0 && (
                <button className="absolute left-5 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/80 hover:bg-red-600 text-white rounded-2xl transition-all z-10" onClick={() => setCarouselIndex(i => i - 1)}>
                  <ChevronLeft size={24} />
                </button>
              )}
              <div className="relative group/img">
                <img key={currentImg?.id} src={currentImg?.url || currentImg?.image} alt=""
                  className="max-h-[65vh] max-w-full object-contain rounded-3xl shadow-2xl"
                  style={{ animation: 'fadeIn 0.2s ease' }} />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition-all rounded-3xl flex flex-col items-center justify-center gap-3 p-4">
                  <button onClick={() => handleDeleteImage(currentImg.id)} className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                    <Trash2 size={14} />Eliminar foto
                  </button>
                  {assigningId === currentImg?.id ? (
                    <div className="bg-black/95 rounded-2xl p-3 space-y-1 min-w-[200px]" onClick={e => e.stopPropagation()}>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 text-center">Mover a proyecto</p>
                      <button onClick={() => handleAssignProject(currentImg.id, null)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-between ${!currentImg.project_id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                        Sin proyecto {!currentImg.project_id && <CheckCircle2 size={12} />}
                      </button>
                      {projects.map(p => (
                        <button key={p.id} onClick={() => handleAssignProject(currentImg.id, p.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-between ${currentImg.project_id === p.id ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                          {p.name} {currentImg.project_id === p.id && <CheckCircle2 size={12} />}
                        </button>
                      ))}
                      <button onClick={() => setAssigningId(null)} className="w-full text-center text-[8px] font-black text-zinc-600 uppercase pt-1 hover:text-zinc-400">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setAssigningId(currentImg?.id)}
                      className="flex items-center gap-2 px-5 py-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                      <Tag size={14} />
                      {projects.find(p => p.id === currentImg?.project_id)?.name ?? 'Sin categoría'}
                    </button>
                  )}
                </div>
              </div>
              {carouselIndex < currentImages.length - 1 && (
                <button className="absolute right-5 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/80 hover:bg-red-600 text-white rounded-2xl transition-all z-10" onClick={() => setCarouselIndex(i => i + 1)}>
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
          )}
          {currentImages.length > 0 && (
            <div className="flex items-center justify-center gap-2 px-6 py-4 overflow-x-auto flex-shrink-0 border-t border-zinc-900" onClick={e => e.stopPropagation()}>
              {currentImages.map((img, i) => (
                <button key={img.id} onClick={() => { setCarouselIndex(i); setAssigningId(null); }}
                  className={`relative flex-shrink-0 w-14 h-10 rounded-xl overflow-hidden border-2 transition-all ${i === carouselIndex ? 'border-red-600 opacity-100 scale-110' : 'border-transparent opacity-40 hover:opacity-70'}`}>
                  <img src={img.url || img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-3 flex-shrink-0">{carouselIndex + 1} / {currentImages.length}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Galería</h2>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
            {totalImages} foto{totalImages !== 1 ? 's' : ''} · {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UploadWithProjectSelector projects={projects} uploading={uploading} onUpload={handleUploadPhoto} large />
          <button onClick={() => setIsAddingProject(v => !v)} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-all">
            <PlusCircle size={16} />Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Búsqueda galería */}
      {projects.length > 0 && (
        <SearchInput value={projectSearch} onChange={setProjectSearch} placeholder="Buscar proyecto..." />
      )}

      {isAddingProject && (
        <form onSubmit={handleCreateProject} className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Crear Nuevo Proyecto</p>
          <input required value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="NOMBRE DEL PROYECTO" className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-[10px] font-black uppercase outline-none focus:border-red-600" />
          <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} placeholder="Descripción (opcional)" className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-xs outline-none focus:border-red-600 min-h-[70px]" />
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsAddingProject(false)} className="flex-1 bg-zinc-900 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800">Cancelar</button>
            <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 active:scale-95">Crear Proyecto</button>
          </div>
        </form>
      )}

      {totalImages === 0 && projects.length === 0 && !isAddingProject ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center"><FileImage size={28} className="text-zinc-700" /></div>
          <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Sin fotos</p>
          <p className="text-[10px] font-bold text-zinc-700 uppercase">Sube fotos con el botón superior.</p>
        </div>
      ) : filteredProjects.length === 0 && projectSearch ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-12 flex flex-col items-center gap-3 text-center">
          <Search size={28} className="text-zinc-700" />
          <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Sin resultados</p>
          <button onClick={() => setProjectSearch('')} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">Limpiar búsqueda</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsWithPhotos.map(project => (
            <div key={project.id} className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 hover:border-red-600 transition-all duration-500 aspect-[4/3]">
              {getCover(project) && <img src={getCover(project)} alt={project.name} className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <Images size={12} className="text-red-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{project.images.length}</span>
              </div>
              <div className="absolute top-4 left-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button onClick={e => { e.stopPropagation(); setEditingProjectId(project.id); setEditingProjectName(project.name); setOpenProject(project); }} className="p-2 bg-black/80 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all"><Edit3 size={13} /></button>
                <button onClick={e => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-2 bg-black/80 hover:bg-red-600 text-zinc-300 hover:text-white rounded-xl transition-all"><Trash2 size={13} /></button>
              </div>
              <button className="absolute bottom-0 left-0 right-0 p-6 text-left" onClick={() => handleOpenProject(project)}>
                <p className="text-white font-black uppercase tracking-widest text-sm leading-none group-hover:text-red-400 transition-colors">{project.name}</p>
                {project.description && <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-2 line-clamp-1">{project.description}</p>}
                <div className="mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Gestionar álbum →</span>
                </div>
              </button>
            </div>
          ))}
          {filteredProjects.filter(p => !p.images?.length).map(project => (
            <div key={project.id} className="group relative overflow-hidden rounded-[2rem] bg-zinc-950 border border-zinc-800 border-dashed hover:border-red-600/50 transition-all duration-500 aspect-[4/3] flex flex-col items-center justify-center gap-3 cursor-pointer" onClick={() => handleOpenProject(project)}>
              <FolderOpen size={36} className="text-zinc-700 group-hover:text-red-600/50 transition-colors" />
              <p className="text-zinc-500 font-black uppercase tracking-widest text-xs group-hover:text-white transition-colors">{project.name}</p>
              <p className="text-zinc-700 font-bold uppercase text-[9px]">Sin fotos · Click para añadir</p>
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={e => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-1.5 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-lg transition-all"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {hasUnassigned && !projectSearch && (
            <div className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 hover:border-red-600 transition-all duration-500 aspect-[4/3] cursor-pointer"
              onClick={() => handleOpenProject({ id: -1, name: 'Sin categoría', description: 'Fotos sin proyecto asignado', images: unassigned })}>
              {(unassigned[0]?.url || unassigned[0]?.image) && <img src={unassigned[0].url || unassigned[0].image} alt="" className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <Images size={12} className="text-red-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{unassigned.length}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-black uppercase tracking-widest text-sm group-hover:text-red-400 transition-colors">Sin categoría</p>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Fotos sin proyecto asignado</p>
                <div className="mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Gestionar →</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD WITH PROJECT SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

const UploadWithProjectSelector: React.FC<{
  projects: GalleryProject[];
  defaultProjectId?: number;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, projectId?: number) => void;
  large?: boolean;
}> = ({ projects, defaultProjectId, uploading, onUpload, large }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(defaultProjectId);
  const [showSelector, setShowSelector] = useState(false);
  useEffect(() => { setSelectedProjectId(defaultProjectId); }, [defaultProjectId]);
  const selectedName = selectedProjectId != null
    ? (projects.find(p => p.id === selectedProjectId)?.name ?? 'Sin proyecto')
    : 'Sin proyecto';
  return (
    <div className="relative flex items-center gap-1">
      <button type="button" onClick={() => setShowSelector(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all">
        <Tag size={12} />
        <span className="max-w-[100px] truncate">{selectedName}</span>
        <ChevronRight size={10} className={`transition-transform ${showSelector ? 'rotate-90' : ''}`} />
      </button>
      {showSelector && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 space-y-1 z-20 min-w-[180px] shadow-2xl">
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2 pt-1 pb-2">Asignar a</p>
          <button onClick={() => { setSelectedProjectId(undefined); setShowSelector(false); }}
            className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-between ${selectedProjectId == null ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
            Sin proyecto {selectedProjectId == null && <CheckCircle2 size={11} />}
          </button>
          {projects.map(p => (
            <button key={p.id} onClick={() => { setSelectedProjectId(p.id); setShowSelector(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-between ${selectedProjectId === p.id ? 'bg-red-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>
              {p.name} {selectedProjectId === p.id && <CheckCircle2 size={11} />}
            </button>
          ))}
        </div>
      )}
      <label className={`flex items-center gap-2 rounded-2xl font-black uppercase tracking-widest cursor-pointer transition-all shadow-xl ${large ? 'px-6 py-3 text-[10px]' : 'px-4 py-2 text-[9px]'} ${uploading ? 'bg-zinc-800 text-zinc-500' : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'}`}>
        {uploading ? <><Activity className="animate-spin" size={large ? 16 : 14} />Subiendo...</> : <><Plus size={large ? 16 : 14} />Añadir foto</>}
        <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => { onUpload(e, selectedProjectId); setShowSelector(false); }} />
      </label>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 p-8 flex items-center justify-between rounded-t-[3rem] z-10">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-3 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all"><X size={18} /></button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO UPLOAD FORM
// ─────────────────────────────────────────────────────────────────────────────

interface PhotoFormProps { label: string; onAdd: (name: string, image: string) => void; }

const PhotoUploadForm: React.FC<PhotoFormProps> = ({ label, onAdd }) => {
  const [name, setName] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    let loaded = 0;
    const newPreviews: string[] = [];
    const newImages: string[] = [];
    fileArray.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        newPreviews[idx] = base64; newImages[idx] = base64; loaded++;
        if (loaded === fileArray.length) { setPreviews(prev => [...prev, ...newPreviews]); setImages(prev => [...prev, ...newImages]); }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || images.length === 0) return;
    images.forEach(image => onAdd(name, image));
    setName(''); setImages([]); setPreviews([]); setIsOpen(false);
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const reset = () => { setIsOpen(false); setName(''); setImages([]); setPreviews([]); };

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex items-center justify-between hover:bg-zinc-900 transition-all">
        <div className="flex items-center gap-3">
          <PlusCircle className="text-red-600" size={18} />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
        </div>
        {isOpen ? <ChevronLeft size={18} className="text-zinc-600" /> : <ChevronRight size={18} className="text-zinc-600" />}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4 border-t border-zinc-900">
          <div>
            <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 rounded-xl bg-black border border-zinc-800 text-white text-xs font-bold uppercase outline-none focus:border-red-600 transition-all" required />
          </div>
          <div>
            <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Fotos (Múltiples)</label>
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 bg-black/40 rounded-2xl cursor-pointer hover:border-red-600 transition-all">
              <FileImage size={32} className="text-zinc-700 mb-2" />
              <p className="text-[9px] font-black text-zinc-600 uppercase">Click para seleccionar fotos</p>
              <p className="text-[8px] text-zinc-700 uppercase mt-1">PNG, JPG</p>
              <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            </label>
          </div>
          {previews.length > 0 && (
            <div className="space-y-2">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Fotos Seleccionadas ({previews.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt="" className="w-full aspect-square object-cover rounded-xl" />
                    <button type="button" onClick={() => removePreview(index)} className="absolute -top-2 -right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl"><X size={12} /></button>
                    <span className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-[8px] font-black text-white">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={reset} className="flex-1 bg-zinc-900 text-zinc-500 px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all">Cancelar</button>
            <button type="submit" disabled={!name || images.length === 0} className={`flex-1 px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${name && images.length > 0 ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
              Agregar {images.length > 0 && `(${images.length})`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SPONSORS MANAGER
// ─────────────────────────────────────────────────────────────────────────────

const SponsorsManager: React.FC = () => {
  const API_BASE = import.meta.env.VITE_API_BASE + '/api';
  const { products } = useApp();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', commission_percent: 5.00, password: '' });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Per-product commission
  const [selectedSponsor, setSelectedSponsor] = useState<any>(null);
  const [productCommissions, setProductCommissions] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingPcts, setEditingPcts] = useState<Record<string, number>>({});

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); }
  };

  const loadSponsors = async () => {
    try {
      const res = await fetch(`${API_BASE}/sponsors`);
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((s: any) => ({
        ...s,
        affiliate_code: s.sponsor_code,
      }));
      setSponsors(mapped);
    } catch { showMsg('Error cargando patrocinadores', true); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSponsors(); }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`${API_BASE}/sponsors/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      showMsg(`Patrocinador ${status === 'active' ? 'aprobado' : 'rechazado'}`);
      loadSponsors();
    } catch { showMsg('Error al actualizar estado', true); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar patrocinador?')) return;
    try {
      await fetch(`${API_BASE}/sponsors/${id}`, { method: 'DELETE' });
      showMsg('Patrocinador eliminado');
      loadSponsors();
    } catch { showMsg('Error al eliminar', true); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return showMsg('Nombre y email requeridos', true);
    if (!editingId && !form.password) return showMsg('La contraseña es requerida para crear', true);
    setSaving(true);
    try {
      if (editingId) {
        const body: any = { name: form.name, email: form.email, phone: form.phone, commission_percent: form.commission_percent };
        if (form.password) body.password = form.password;
        await fetch(`${API_BASE}/sponsors/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        showMsg('Patrocinador actualizado');
      } else {
        await fetch(`${API_BASE}/sponsors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password, commission_percent: form.commission_percent }),
        });
        showMsg('Patrocinador creado');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', email: '', phone: '', commission_percent: 5.00, password: '' });
      loadSponsors();
    } catch { showMsg('Error al guardar', true); }
    finally { setSaving(false); }
  };

  const openEdit = (sp: any) => {
    setEditingId(sp.id);
    setForm({ name: sp.name, email: sp.email, phone: sp.phone || '', commission_percent: sp.commission_percent, password: '' });
    setShowForm(true);
  };

  const openProductCommissions = async (sp: any) => {
    setSelectedSponsor(sp);
    try {
      const code = sp.affiliate_code || sp.sponsor_code;
      const res = await fetch(`${API_BASE}/sponsors/${code}/product-commissions`);
      const data = await res.json();
      setProductCommissions(Array.isArray(data) ? data : []);
    } catch { setProductCommissions([]); }
    setShowProductModal(true);
  };

  const setProductCommission = async (productId: string, percent: number) => {
    if (!selectedSponsor) return;
    try {
      const code = selectedSponsor.affiliate_code || selectedSponsor.sponsor_code;
      await fetch(`${API_BASE}/sponsors/${code}/product-commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, commission_percent: percent }),
      });
      const res = await fetch(`${API_BASE}/sponsors/${code}/product-commissions`);
      const data = await res.json();
      setProductCommissions(Array.isArray(data) ? data : []);
      showMsg('Comisión configurada');
    } catch { showMsg('Error al configurar comisión', true); }
  };

  const filtered = sponsors.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.affiliate_code?.toLowerCase().includes(q);
    }
    return true;
  });

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-8">
      {(error || success) && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3
          ${error ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {error || success}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Patrocinadores</h2>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
            {sponsors.length} patrocinador{sponsors.length !== 1 ? 'es' : ''} · {sponsors.filter(s => s.status === 'active').length} activo{sponsors.filter(s => s.status === 'active').length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ name: '', email: '', phone: '', commission_percent: 5.00, password: '' }); setShowForm(true); }}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg active:scale-95">
          <Plus size={16} />Crear Patrocinador
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-zinc-950 border border-zinc-900 rounded-2xl p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar patrocinador..." />
        <div className="flex gap-1 bg-black border border-zinc-900 rounded-xl p-1">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'active', label: 'Activos' },
            { value: 'rejected', label: 'Rechazados' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                ${filterStatus === opt.value ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">
            ✏️ {editingId ? 'Editando patrocinador' : 'Nuevo patrocinador'}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Nombre</label>
              <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm font-bold outline-none focus:border-red-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Email</label>
              <input value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm outline-none focus:border-red-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Teléfono</label>
              <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm outline-none focus:border-red-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Comisión base (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.commission_percent}
                onChange={e => setForm(prev => ({ ...prev, commission_percent: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm outline-none focus:border-red-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Contraseña{editingId ? ' (opcional)' : ''}</label>
              <input type="password" value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-sm outline-none focus:border-red-600" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-zinc-900">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex-1 bg-zinc-900 text-zinc-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-zinc-600">
          <Activity className="animate-spin" size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Cargando...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-16 flex flex-col items-center gap-4 text-center">
          <Users size={32} className="text-zinc-700" />
          <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Sin patrocinadores</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sp => (
            <div key={sp.id} className="bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Users size={22} className="text-zinc-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-white font-black uppercase">{sp.name}</p>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg
                    ${sp.status === 'active' ? 'bg-green-900/30 text-green-400' : sp.status === 'pending' ? 'bg-yellow-900/20 text-yellow-500' : 'bg-red-900/20 text-red-400'}`}>
                    {sp.status}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest space-y-0.5">
                  <p>{sp.email} · {sp.phone || 'Sin teléfono'}</p>
                  <p className="text-zinc-600">Código: <span className="text-red-500 font-black">{sp.affiliate_code}</span> · Comisión base: {sp.commission_percent}% · Clicks: {sp.clicks || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {sp.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatusChange(sp.id, 'active')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">
                      Aprobar
                    </button>
                    <button onClick={() => handleStatusChange(sp.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">
                      Rechazar
                    </button>
                  </>
                )}
                <button onClick={() => openProductCommissions(sp)}
                  className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl transition-all" title="Comisiones por producto">
                  <Percent size={18} />
                </button>
                <button onClick={() => openEdit(sp)}
                  className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl transition-all">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => handleDelete(sp.id)}
                  className="p-3 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Comisiones por producto */}
      {showProductModal && selectedSponsor && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-[3rem] max-w-xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 p-6 flex items-center justify-between rounded-t-[3rem] z-10">
              <div>
                <h3 className="text-lg font-black text-white uppercase">{selectedSponsor.name}</h3>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Comisiones por producto</p>
              </div>
              <button onClick={() => { setShowProductModal(false); setSelectedSponsor(null); }}
                className="p-3 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {products.slice(0, 20).map(product => {
                const existing = productCommissions.find(pc => pc.product_id === product.id);
                const pct = editingPcts[product.id] ?? existing?.commission_percent ?? selectedSponsor.commission_percent;
                return (
                  <div key={product.id} className="flex items-center gap-4 bg-black border border-zinc-900 rounded-2xl p-4">
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-xs truncate">{product.name}</p>
                      <p className="text-zinc-500 text-[9px] font-bold uppercase">{formatCOP(product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.01" min="0" max="100" value={pct}
                        onChange={e => setEditingPcts(prev => ({ ...prev, [product.id]: parseFloat(e.target.value) || 0 }))}
                        className="w-20 bg-zinc-900 border border-zinc-800 text-white p-2 rounded-xl text-xs text-center outline-none focus:border-red-600" />
                      <span className="text-zinc-500 text-xs font-bold">%</span>
                      <button onClick={() => setProductCommission(product.id, pct)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all active:scale-95">
                        <Save size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 text-[9px] font-bold text-zinc-600 uppercase tracking-widest space-y-1">
        <p className="text-zinc-500 font-black">💡 Patrocinadores</p>
        <p>Los patrocinadores comparten su link único. Cuando alguien compra a través de ese link, el patrocinador gana comisión.</p>
        <p>Link de patrocinador: <span className="text-red-500">{window.location.origin}/?ref=CODIGO</span></p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const {
    products, orders, events, adminUsers,
    updateSettings, updateProduct, addProduct, deleteProduct,
    registrations, deleteRegistration, deleteOrder,
    galleryImages, deleteGalleryImage, addGalleryImage,
    updateAdminUser, deleteAdminUser,
    settings, addEvent, deleteEvent,
    fetchOrders, // <-- agrega esta (o como se llame en tu contexto)
  } = useApp();

  const { categories: dynCategories, loading: dynCatsLoading } = useDynCategories();
  const activeCats = dynCategories.filter(c => c.active);

  const [activeTab, setActiveTab] = useState<'stats' | 'events' | 'products' | 'registrations' | 'gallery' | 'payments' | 'settings' | 'staff' | 'categories' | 'sponsors'>('stats');
  const [settingsTab, setSettingsTab] = useState<'Embajadores' | 'Patrocinadores' | 'Trayectoria' | 'Hero'>('Embajadores');
  const [activeModal, setActiveModal] = useState<'event' | 'product' | 'gallery' | 'manual_reg' | 'receipt' | 'new_staff' | 'order_detail' | null>(null);

  // ── Filtros y búsqueda por sección ──
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  const [regsSearch, setRegsSearch] = useState('');
  const [productsSearch, setProductsSearch] = useState('');
  const [productsSegment, setProductsSegment] = useState('all');
  const [productsCategory, setProductsCategory] = useState('all');
  const [eventsSearch, setEventsSearch] = useState('');
  const [eventsType, setEventsType] = useState('all');
  const [staffSearch, setStaffSearch] = useState('');
  const [goToLastPage, setGoToLastPage] = useState(false);

  const [eventForm, setEventForm] = useState<Partial<EliteEvent>>({ startDate: '', endDate: '', type: 'Torneo', category: '', description: '', notes: '', status: 'Abierto', segment: 'elite' });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [productImagePreview, setProductImagePreview] = useState('');
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', pin: '' });
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', description: '', price: 0, image: '', stock: 0,
     category: ProductCategory.OFFICIAL, sizes: ['S', 'M', 'L', 'XL'], segment: 'elite',
  });
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => { setLocalSettings(settings); }, [settings]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, description: p.description, price: p.price,
      image: p.image, stock: p.stock, category: p.category, sizes: p.sizes, segment: p.segment,
    });
    setProductImagePreview(p.image);
    setActiveModal('product');
  };

  useEffect(() => {
    if (activeModal === 'product' && activeCats.length > 0 && !editingProduct) {
      const exists = activeCats.some(c => c.key_name === productForm.category);
      if (!exists) setProductForm(prev => ({ ...prev, category: activeCats[0].key_name as any }));
    }
  }, [activeModal, activeCats, editingProduct]);

  // ── Filtros calculados ──

  const filteredOrders = useMemo(() => {
    const statusOrder: Record<string, number> = {
      'PAGADO': 0,
      'PENDIENTE': 1,
      'RECHAZADO': 2,
      'ANULADO': 3,
      'DESPACHADO': 4,
    };

    return orders
      .filter(o => {
        if (ordersStatusFilter !== 'all' && o.status !== ordersStatusFilter) return false;
        if (ordersSearch) {
          const q = ordersSearch.toLowerCase();
          return o.customerName?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const aOrder = statusOrder[a.status] ?? 99;
        const bOrder = statusOrder[b.status] ?? 99;
        return aOrder - bOrder;
      });
  }, [orders, ordersSearch, ordersStatusFilter]);

  const filteredRegistrations = useMemo(() => {
    if (!regsSearch) return registrations;
    const q = regsSearch.toLowerCase();
    return registrations.filter(r =>
      r.teamName?.toLowerCase().includes(q) ||
      r.contactName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  }, [registrations, regsSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (productsSegment !== 'all' && p.segment !== productsSegment) return false;
      if (productsCategory !== 'all' && p.category !== productsCategory) return false;
      if (productsSearch) {
        const q = productsSearch.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, productsSearch, productsSegment, productsCategory]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (eventsType !== 'all' && e.type !== eventsType) return false;
      if (eventsSearch) {
        const q = eventsSearch.toLowerCase();
        return e.category?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [events, eventsSearch, eventsType]);

  const filteredStaff = useMemo(() => {
    if (!staffSearch) return adminUsers;
    const q = staffSearch.toLowerCase();
    return adminUsers.filter(u => u.name?.toLowerCase().includes(q));
  }, [adminUsers, staffSearch]);

  // ── Paginación ──
  const ordersPagination = usePagination(filteredOrders, PAGE_SIZE);
  const regsPagination = usePagination(filteredRegistrations, PAGE_SIZE);
  const productsPagination = usePagination(filteredProducts, PAGE_SIZE);
  const eventsPagination = usePagination(filteredEvents, PAGE_SIZE);
  const staffPagination = usePagination(filteredStaff, PAGE_SIZE);

  // ── Settings helpers ──
  const ambassadorsList: any[] = useMemo(() => {
    const raw = localSettings.ambassadorsImage;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return []; } }
    return [];
  }, [localSettings.ambassadorsImage]);

  const sponsorsList: any[] = useMemo(() => {
    const raw = localSettings.sponsorsImage;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return []; } }
    return [];
  }, [localSettings.sponsorsImage]);

  const handleSaveSettings = async () => {
    try { setIsSaving(true); await updateSettings(localSettings); setSavedOk(true); setTimeout(() => setSavedOk(false), 3000); }
    finally { setIsSaving(false); }
  };

  const SaveButton = ({ className = '' }: { className?: string }) => (
    <button onClick={handleSaveSettings} disabled={isSaving}
      className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-xl ${savedOk ? 'bg-green-600 text-white shadow-green-900/30'
        : isSaving ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          : 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/30'
        } ${className}`}>
      {savedOk ? <><CheckCircle2 size={18} />¡Guardado!</>
        : isSaving ? <><Activity className="animate-spin" size={18} />Guardando...</>
          : <><Save size={18} />Guardar Cambios</>}
    </button>
  );

  const handleAddAmbassadorPhoto = useCallback((name: string, image: string) => {
    setLocalSettings(prev => { const current = Array.isArray(prev.ambassadorsImage) ? prev.ambassadorsImage : []; return { ...prev, ambassadorsImage: [...current, { id: Date.now(), name, image }] }; });
  }, []);

  const handleDeleteAmbassadorPhoto = useCallback((id: number) => {
    setLocalSettings(prev => { const current = Array.isArray(prev.ambassadorsImage) ? prev.ambassadorsImage : []; return { ...prev, ambassadorsImage: current.filter((a: any) => a.id !== id) }; });
  }, []);

  const handleAddSponsorsPhoto = useCallback((name: string, image: string) => {
    setLocalSettings(prev => { const current = Array.isArray(prev.sponsorsImage) ? prev.sponsorsImage : []; return { ...prev, sponsorsImage: [...current, { id: Date.now(), name, image }] }; });
  }, []);

  const handleDeleteSponsorsPhoto = useCallback((id: number) => {
    setLocalSettings(prev => { const current = Array.isArray(prev.sponsorsImage) ? prev.sponsorsImage : []; return { ...prev, sponsorsImage: current.filter((a: any) => a.id !== id) }; });
  }, []);

  const totalSales = orders?.reduce((acc, order) => acc + Number(order.total || 0), 0) ?? 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target?: 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === 'product') {
      const reader = new FileReader();
      reader.onloadend = () => { const base64 = reader.result as string; setProductForm(prev => ({ ...prev, image: base64 })); setProductImagePreview(base64); };
      reader.readAsDataURL(file);
    } else {
      setGalleryFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setGalleryPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result as string); reader.onerror = err => reject(err); });

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault(); addEvent(eventForm); setActiveModal(null);
    setEventForm({ startDate: '', endDate: '', type: 'Torneo', category: '', description: '', notes: '', status: 'Abierto', segment: 'elite' });
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.image) return alert('Sube una imagen');
    if (editingProduct) { updateProduct({ ...editingProduct, ...productForm }); }
    else { addProduct(productForm); }
    setActiveModal(null); setProductImagePreview(''); setEditingProduct(null);
    setProductForm({ name: '', description: '', price: 0, image: '', stock: 0, category: ProductCategory.OFFICIAL, sizes: ['S', 'M', 'L', 'XL'], segment: 'elite' });
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffForm.pin.length !== 4) return alert('El PIN debe ser de 4 dígitos.');
    updateAdminUser(editingStaffId ? { ...staffForm, id: editingStaffId } : { ...staffForm, id: Math.random().toString(36).substr(2, 5) });
    setStaffForm({ name: '', pin: '' }); setEditingStaffId(null); setActiveModal(null);
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!galleryFile) return;
    try { setIsUploading(true); const base64Data = await fileToBase64(galleryFile); await addGalleryImage(base64Data); setGalleryFile(null); setGalleryPreview(''); setActiveModal(null); }
    catch { alert('Error al procesar la imagen'); } finally { setIsUploading(false); }
  };

  const openStaffModal = (user?: AdminUser) => {
    if (user) { setEditingStaffId(user.id); setStaffForm({ name: user.name, pin: user.pin }); }
    else { setEditingStaffId(null); setStaffForm({ name: '', pin: '' }); }
    setActiveModal('new_staff');
  };

  const openOrderDetail = async (o: Order) => {
    setSelectedOrder(o);
    setActiveModal('order_detail');
    setLoadingItems(true);
    setOrderItems([]);
    try {
      const res = await fetch(`${API_BASE}/orders/${o.id}/items`);
      const data = await res.json();
      setOrderItems(Array.isArray(data) ? data : []);
    } catch { setOrderItems([]); }
    finally { setLoadingItems(false); }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Torneo': return 'border-red-600 bg-red-600/10 text-red-600';
      case 'Entrenamiento': return 'border-blue-600 bg-blue-600/10 text-blue-600';
      case 'Workshop': return 'border-green-600 bg-green-600/10 text-green-600';
      case 'Meetup': return 'border-purple-600 bg-purple-600/10 text-purple-600';
      default: return 'border-zinc-600 bg-zinc-600/10 text-zinc-400';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Torneo': return <Trophy size={14} />;
      case 'Entrenamiento': return <Zap size={14} />;
      case 'Workshop': return <GraduationCap size={14} />;
      case 'Meetup': return <UsersRound size={14} />;
      default: return <CalendarIcon size={14} />;
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const SETTINGS_TABS = ['Embajadores', 'Patrocinadores', 'Trayectoria', 'Hero'] as const;

  const SIDEBAR_ITEMS = [
    { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Torneos', icon: CalendarIcon },
    { id: 'products', label: 'Inventario', icon: ShoppingBag },
    { id: 'payments', label: 'Ventas', icon: Wallet },
    { id: 'registrations', label: 'Inscritos', icon: Users },
    { id: 'gallery', label: 'Galería', icon: ImageIcon },
    { id: 'categories', label: 'Categorías', icon: Tag },
    { id: 'sponsors', label: 'Patrocinadores', icon: Users },
    { id: 'staff', label: 'Personal', icon: Shield },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];
 
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAGADO': return 'bg-green-900/30 border-green-600 text-green-400';
      case 'RECHAZADO': return 'bg-red-900/30 border-red-600 text-red-400';
      case 'ANULADO': return 'bg-zinc-900 border-zinc-700 text-zinc-500';
      default: return 'bg-yellow-900/20 border-yellow-700 text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAGADO': return '✅';
      case 'DESPACHADO': return '📦';
      case 'RECHAZADO': return '❌';
      case 'ANULADO': return '🚫';
      default: return '⏳';
    }
  };

  useEffect(() => {
    if (goToLastPage) {
      ordersPagination.setPage(ordersPagination.totalPages);
      setGoToLastPage(false);
    }
  }, [goToLastPage, filteredOrders]); 

  // ── Componente de barra de filtros reutilizable ──
  const FilterBar: React.FC<{ children: React.ReactNode; hasFilters: boolean; onClear: () => void }> = ({ children, hasFilters, onClear }) => (
    <div className="flex flex-wrap gap-3 items-center bg-zinc-950 border border-zinc-900 rounded-2xl p-4">
      {children}
      {hasFilters && (
        <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors border border-zinc-800">
          <X size={11} />Limpiar
        </button>
      )}
    </div>
  );

  // ── Componente de estado vacío ──
  const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-16 flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">{icon}</div>
      <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">{title}</p>
      {subtitle && <p className="text-[10px] font-bold text-zinc-700 uppercase">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-80 space-y-2 bg-zinc-950 border border-zinc-900 rounded-[3rem] p-6">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-4 w-full px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all
                ${activeTab === item.id ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-900/50 text-zinc-500 hover:text-white border border-zinc-800/50'}`}>
              <item.icon size={18} />{item.label}
            </button>
          ))}
          <button onClick={onLogout} className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-zinc-900/50 text-zinc-500 hover:text-white border border-zinc-800/50 transition-all mt-2">
            <LogOut size={18} />Cerrar Sesión
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">

          {activeTab === 'categories' && <CategoriesManager />}

          {activeTab === 'sponsors' && <SponsorsManager />}

          {/* ── VENTAS ── */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Historial de Ventas</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-600/30 p-8 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Total Ingresos</p>
                  <p className="text-4xl font-black text-white">{totalSales.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                  })}</p>
                </div>
                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 p-8 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Pedidos Totales</p>
                  <p className="text-4xl font-black text-white">{orders.length}</p>
                </div>
              </div>

              <FilterBar
                hasFilters={ordersSearch !== '' || ordersStatusFilter !== 'all'}
                onClear={() => { setOrdersSearch(''); setOrdersStatusFilter('all'); }}
              >
                <SearchInput value={ordersSearch} onChange={setOrdersSearch} placeholder="Buscar por nombre, ID, email..." />
                <div className="flex gap-1 bg-black border border-zinc-900 rounded-xl p-1">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'PAGADO', label: '✅ Pagado' },
                    { value: 'PENDIENTE', label: '⏳ Pendiente' },
                    { value: 'RECHAZADO', label: '❌ Rechazado' },
                    { value: 'ANULADO', label: '🚫 Anulado' },
                    { value: 'DESPACHADO', label: '📦 Despachado' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setOrdersStatusFilter(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                        ${ordersStatusFilter === opt.value ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterBar>

              {filteredOrders.length === 0 ? (
                <EmptyState icon={<Wallet size={28} className="text-zinc-700" />} title={orders.length === 0 ? 'Sin ventas' : 'Sin resultados'} subtitle={orders.length > 0 ? 'Prueba otros filtros' : undefined} />
              ) : (
                <div className="space-y-4">
                  {ordersPagination.paginated.map(o => (
                    <div key={o.id} className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-white uppercase">{o.customerName}</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${getStatusStyle(o.status)}`}>
                            {getStatusIcon(o.status)} {o.status}
                          </span>
                        </div>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{o.id}</p>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-500 uppercase">
                          <span>{new Date(o.created_at || Date.now()).toLocaleDateString()}</span>
                          <span>{o.paymentMethod}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-black text-red-600">${Number(o.total).toLocaleString('es-CO')}</p>
                        <button onClick={() => openOrderDetail(o)}
                          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-[9px] font-black text-red-600 uppercase tracking-widest hover:text-white transition-all rounded-xl border border-zinc-800">
                          Ver Detalles
                        </button>
                        <button onClick={() => { if (confirm('¿Eliminar pedido?')) deleteOrder(o.id); }} className="p-4 bg-zinc-900 hover:bg-red-600 text-zinc-700 hover:text-white rounded-2xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  <Pagination page={ordersPagination.page} totalPages={ordersPagination.totalPages} total={ordersPagination.total} pageSize={PAGE_SIZE} onPage={ordersPagination.setPage} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && <GalleryManager galleryImages={galleryImages} deleteGalleryImage={deleteGalleryImage} addGalleryImage={addGalleryImage} />}

          {/* ── INSCRITOS ── */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Equipos Inscritos</h2>
                <div className="bg-zinc-950 border border-zinc-900 px-6 py-3 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{registrations.length} Registros Totales</p>
                </div>
              </div>

              <FilterBar hasFilters={regsSearch !== ''} onClear={() => setRegsSearch('')}>
                <SearchInput value={regsSearch} onChange={setRegsSearch} placeholder="Buscar equipo, contacto, email..." />
              </FilterBar>

              {filteredRegistrations.length === 0 ? (
                <EmptyState icon={<Users size={28} className="text-zinc-700" />} title={registrations.length === 0 ? 'Sin inscritos' : 'Sin resultados'} subtitle={registrations.length > 0 ? 'Prueba otro término de búsqueda' : undefined} />
              ) : (
                <div className="space-y-4">
                  {regsPagination.paginated.map(r => {
                    const tournament = events.find(e => e.id === r.tournamentId);
                    return (
                      <div key={r.id} className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <p className="text-lg font-black text-white uppercase">{r.teamName}</p>
                          <div className="space-y-1 text-[10px] font-bold text-zinc-500 uppercase">
                            <div className="flex items-center gap-2"><UserIcon size={12} />{r.contactName}</div>
                            <div className="flex items-center gap-2"><PhoneIcon size={12} />{r.phone}</div>
                            <div className="flex items-center gap-2"><Mail size={12} />{r.email}</div>
                          </div>
                          <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">Torneo: {tournament?.category || 'Torneo Desconocido'}</p>
                        </div>
                        <button onClick={() => { if (confirm('¿Eliminar esta inscripción?')) deleteRegistration(r.id); }} className="self-start md:self-center p-5 bg-zinc-900 text-zinc-700 hover:bg-red-600 hover:text-white rounded-[1.5rem] transition-all"><Trash2 size={18} /></button>
                      </div>
                    );
                  })}
                  <Pagination page={regsPagination.page} totalPages={regsPagination.totalPages} total={regsPagination.total} pageSize={PAGE_SIZE} onPage={regsPagination.setPage} />
                </div>
              )}
            </div>
          )}

          {/* ── EVENTOS ── */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Calendario de Eventos</h2>
                <button onClick={() => setActiveModal('event')} className="w-full md:w-auto bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-red-900/20">
                  <Plus size={18} />Crear Nuevo Evento
                </button>
              </div>

              <FilterBar
                hasFilters={eventsSearch !== '' || eventsType !== 'all'}
                onClear={() => { setEventsSearch(''); setEventsType('all'); }}
              >
                <SearchInput value={eventsSearch} onChange={setEventsSearch} placeholder="Buscar evento..." />
                <div className="flex gap-1 bg-black border border-zinc-900 rounded-xl p-1">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'Torneo', label: '🏆 Torneo' },
                    { value: 'Entrenamiento', label: '⚡ Entrena' },
                    { value: 'Workshop', label: '🎓 Workshop' },
                    { value: 'Meetup', label: '👥 Meetup' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setEventsType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                        ${eventsType === opt.value ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FilterBar>

              {filteredEvents.length === 0 ? (
                <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-12 text-center">
                  <CalendarIcon size={48} className="mx-auto mb-4 text-zinc-800" />
                  <p className="text-zinc-600 font-bold uppercase text-xs">{events.length === 0 ? 'No hay eventos en la agenda.' : 'Sin resultados para estos filtros.'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsPagination.paginated.map(e => (
                    <div key={e.id} className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 bg-black border border-zinc-800 rounded-2xl p-6 text-center min-w-[100px]">
                        <p className="text-4xl font-black text-white">{new Date(e.startDate).getDate()}</p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{new Date(e.startDate).toLocaleString('es-ES', { month: 'short' }).toUpperCase()}</p>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest ${getEventColor(e.type)}`}>
                          {getEventIcon(e.type)}{e.type}
                        </div>
                        <h3 className="text-xl font-black text-white uppercase">{e.category}</h3>
                        <p className="text-xs text-zinc-500">{e.description}</p>
                      </div>
                      <button onClick={() => { if (confirm('¿Eliminar evento?')) deleteEvent(e.id); }} className="p-4 bg-zinc-900 text-zinc-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <Pagination page={eventsPagination.page} totalPages={eventsPagination.totalPages} total={eventsPagination.total} pageSize={PAGE_SIZE} onPage={eventsPagination.setPage} />
                </div>
              )}
            </div>
          )}

          {/* ── STATS ── */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-600/30 p-8 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Caja Total</p>
                  <p className="text-4xl font-black text-white">{orders
                    .reduce((a, b) => a + Number(b.total || 0), 0)
                    .toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                    })}</p>
                </div>
                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 p-8 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Productos</p>
                  <p className="text-4xl font-black text-white">{products.length}</p>
                </div>
                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/30 p-8 rounded-[2.5rem]">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Torneos</p>
                  <p className="text-4xl font-black text-white">{events.length}</p>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-8">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">Calendario de Eventos</h3>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 text-zinc-500 hover:text-white"><ChevronLeft /></button>
                  <h4 className="text-lg font-black text-white uppercase">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h4>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 text-zinc-500 hover:text-white"><ChevronRight /></button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="text-center text-[9px] font-black text-zinc-600 uppercase p-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {generateCalendarDays().map((day, i) => {
                    const dateStr = day ? day.toISOString().split('T')[0] : '';
                    const dayEvents = events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
                    return (
                      <div key={i} className={`min-h-[80px] p-2 rounded-xl ${day ? 'bg-zinc-900 border border-zinc-800' : ''}`}>
                        {day && (<>
                          <p className="text-xs font-bold text-zinc-500">{day.getDate()}</p>
                          <div className="space-y-1 mt-1">
                            {dayEvents.map(de => (
                              <div key={de.id} className={`text-[7px] font-black uppercase px-1 py-0.5 rounded border ${getEventColor(de.type)}`}>{de.category}</div>
                            ))}
                          </div>
                        </>)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {lowStockProducts.length > 0 && (
                <div className="bg-red-950/30 border border-red-900/50 rounded-[2rem] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="text-red-600" size={24} />
                    <h3 className="text-lg font-black text-red-600 uppercase tracking-tight">ALERTA DE STOCK BAJO</h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl">
                        <p className="text-xs font-bold text-white">{p.name} ({p.segment})</p>
                        <p className="text-[10px] font-black text-red-600 uppercase">Quedan: {p.stock}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INVENTARIO ── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Inventario</h2>
                <button onClick={() => setActiveModal('product')} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl active:scale-95">
                  <Plus size={18} />Nuevo Producto
                </button>
              </div>

              <FilterBar
                hasFilters={productsSearch !== '' || productsSegment !== 'all' || productsCategory !== 'all'}
                onClear={() => { setProductsSearch(''); setProductsSegment('all'); setProductsCategory('all'); }}
              >
                <SearchInput value={productsSearch} onChange={setProductsSearch} placeholder="Buscar producto..." />
                <div className="flex gap-1 bg-black border border-zinc-900 rounded-xl p-1">
                  {[{ value: 'all', label: 'Todos' }, { value: 'elite', label: 'Elite' }].map(opt => (
                    <button key={opt.value} onClick={() => setProductsSegment(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                        ${productsSegment === opt.value ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {dynCategories.filter(c => c.active).length > 0 && (
                  <div className="flex gap-1 bg-black border border-zinc-900 rounded-xl p-1 flex-wrap">
                    <button onClick={() => setProductsCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                        ${productsCategory === 'all' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                      Todas
                    </button>
                    {dynCategories.filter(c => c.active).map(cat => (
                      <button key={cat.id} onClick={() => setProductsCategory(cat.key_name)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1
                          ${productsCategory === cat.key_name ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </FilterBar>

              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <EmptyState icon={<Package size={28} className="text-zinc-700" />} title={products.length === 0 ? 'Sin productos' : 'Sin resultados'} subtitle={products.length > 0 ? 'Prueba otros filtros' : undefined} />
                ) : (
                  <>
                    {productsPagination.paginated.map(p => (
                      <div key={p.id} className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex flex-col md:flex-row gap-6">
                        <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-2xl" />
                        <div className="flex-1 grid md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm font-black text-white uppercase mb-2">{p.name}</p>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase">
                              {p.segment}&nbsp;-&nbsp;
                              {(() => {
                                const cat = dynCategories.find(c => c.key_name === p.category);
                                return cat ? (
                                  <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400">
                                    {cat.icon} {cat.label}
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold text-zinc-700 uppercase mt-1 block">{p.category}</span>
                                );
                              })()}
                            </p>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block">Precio</label>
                            ${Number(p.price).toLocaleString('es-CO')}
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block">Stock</label>
                            <span className={p.stock < 5 && p.stock > 0 ? 'text-red-500 font-black' : ''}>{p.stock}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteProduct(p.id)} className="p-3 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-xl transition-all"><Trash2 size={18} /></button>
                        <button onClick={() => openEditProduct(p)} className="p-3 bg-zinc-900 hover:bg-zinc-700 text-zinc-500 hover:text-white rounded-xl transition-all"><Edit3 size={18} /></button>
                      </div>
                    ))}
                    <Pagination page={productsPagination.page} totalPages={productsPagination.totalPages} total={productsPagination.total} pageSize={PAGE_SIZE} onPage={productsPagination.setPage} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── PERSONAL ── */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Administración</h2>
                <button onClick={() => openStaffModal()} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3"><UserPlus size={18} />Nuevo Admin</button>
              </div>

              <FilterBar hasFilters={staffSearch !== ''} onClear={() => setStaffSearch('')}>
                <SearchInput value={staffSearch} onChange={setStaffSearch} placeholder="Buscar administrador..." />
              </FilterBar>

              <div className="space-y-4">
                {filteredStaff.length === 0 ? (
                  <EmptyState icon={<Users size={28} className="text-zinc-700" />} title={adminUsers.length === 0 ? 'Sin administradores' : 'Sin resultados'} />
                ) : (
                  <>
                    {staffPagination.paginated.map(user => (
                      <div key={user.id} className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-lg font-black text-white uppercase">{user.name}</p>
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">ACCESO PIN ACTIVO</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => openStaffModal(user)} className="p-4 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all"><Edit3 size={18} /></button>
                          <button onClick={() => deleteAdminUser(user.id)} className="p-4 bg-zinc-900 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                    <Pagination page={staffPagination.page} totalPages={staffPagination.totalPages} total={staffPagination.total} pageSize={PAGE_SIZE} onPage={staffPagination.setPage} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── AJUSTES ── */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Ajustes Generales</h2>
                <SaveButton />
              </div>
              <div className="flex gap-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-1 w-fit">
                {SETTINGS_TABS.map((tab) => (
                  <button key={tab} onClick={() => setSettingsTab(tab)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsTab === tab ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {settingsTab === 'Embajadores' && (
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2"><Users className="text-red-600" /> Embajadores</h4>
                  <PhotoUploadForm label="Agregar Embajador" onAdd={handleAddAmbassadorPhoto} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {ambassadorsList.map((amb: any) => (
                      <div key={amb.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 relative group">
                        <img src={amb.image} alt={amb.name} className="w-full aspect-square object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all" />
                        <p className="text-[9px] font-black uppercase text-white mt-2 truncate">{amb.name}</p>
                        <button onClick={() => handleDeleteAmbassadorPhoto(amb.id)} className="absolute top-2 right-2 p-2 bg-black/80 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Texto Sección Embajadores</label>
                    <textarea value={localSettings.ambassadors || ''} onChange={e => setLocalSettings(prev => ({ ...prev, ambassadors: e.target.value }))} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs min-h-[100px] outline-none focus:border-red-600" />
                  </div>
                </div>
              )}

              {settingsTab === 'Patrocinadores' && (
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2"><Star className="text-red-600" /> Patrocinadores</h4>
                  <PhotoUploadForm label="Agregar Patrocinador" onAdd={handleAddSponsorsPhoto} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sponsorsList.map((sp: any) => (
                      <div key={sp.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 relative group">
                        <img src={sp.image} alt={sp.name} className="w-full aspect-square object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all" />
                        <p className="text-[9px] font-black uppercase text-white mt-2 truncate">{sp.name}</p>
                        <button onClick={() => handleDeleteSponsorsPhoto(sp.id)} className="absolute top-2 right-2 p-2 bg-black/80 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Texto Sección Patrocinadores</label>
                    <textarea value={localSettings.sponsors || ''} onChange={e => setLocalSettings(prev => ({ ...prev, sponsors: e.target.value }))} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs min-h-[100px] outline-none focus:border-red-600" />
                  </div>
                </div>
              )}

              {settingsTab === 'Trayectoria' && (
                <div className="space-y-10">
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h4 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2"><Users className="text-red-600" /> Trayectoria</h4>
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Historia Bachestic</label>
                        <textarea value={localSettings.historyBachestic || ''} onChange={e => setLocalSettings(prev => ({ ...prev, historyBachestic: e.target.value }))} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs min-h-[100px] outline-none focus:border-red-600" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Historia Elite</label>
                        <textarea value={localSettings.historyElite || ''} onChange={e => setLocalSettings(prev => ({ ...prev, historyElite: e.target.value }))} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs min-h-[100px] outline-none focus:border-red-600" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fotos Sección Trayectoria</p>
                      <div className="grid grid-cols-2 gap-4">
                        {(['Bachestic', 'Elite'] as const).map(seg => {
                          const key = seg === 'Bachestic' ? 'photoTrayectoriaBachestic' : 'photoTrayectoriaElite';
                          return (
                            <div key={seg} className="space-y-2">
                              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Foto {seg}</label>
                              <label className="relative flex flex-col items-center justify-center cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed border-zinc-800 hover:border-red-600 transition-all bg-black/40 aspect-[4/3]">
                                {(localSettings as any)[key] ? (
                                  <>
                                    <img src={(localSettings as any)[key]} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-all flex items-center justify-center">
                                      <p className="text-[9px] font-black text-white uppercase tracking-widest">Cambiar</p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-zinc-700">
                                    <FileImage size={24} />
                                    <p className="text-[7px] font-black uppercase text-center">Subir {seg}</p>
                                  </div>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0]; if (!file) return;
                                  const reader = new FileReader();
                                  reader.onloadend = () => setLocalSettings(prev => ({ ...prev, [key]: reader.result as string }));
                                  reader.readAsDataURL(file);
                                }} />
                              </label>
                              {(localSettings as any)[key] && (
                                <button type="button" onClick={() => setLocalSettings(prev => ({ ...prev, [key]: '' }))}
                                  className="text-[8px] font-black text-red-600 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1">
                                  <X size={10} /> Eliminar
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-900 space-y-5">
                    <div className="flex items-center gap-3">
                      <Activity className="text-red-600" size={18} />
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estadísticas visibles en la web</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: 'statYear', label: 'Año de Fundación', note: 'Aparece como stat "FUNDACIÓN"', placeholder: '2015' },
                        { key: 'statCollections', label: 'Stat Bachestic', note: 'Aparece como "COLECCIONES"', placeholder: '50+' },
                        { key: 'statEliteEvents', label: 'Stat Elite', note: 'Aparece como "EVENTOS ELITE"', placeholder: '50+' },
                      ].map(({ key, label, note, placeholder }) => (
                        <div key={key} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-3">
                          <div>
                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">{label}</label>
                            <p className="text-[7px] text-zinc-700 uppercase tracking-widest">{note}</p>
                          </div>
                          <input type="text" value={(localSettings as any)[key] || placeholder}
                            onChange={e => setLocalSettings(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-black border border-zinc-800 text-white p-4 rounded-xl text-2xl font-black outline-none focus:border-red-600 text-center tracking-tighter"
                            placeholder={placeholder} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'Hero' && (
                <div className="space-y-6">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2"><ImageIcon className="text-red-600" /> Imágenes Hero (Header Principal)</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                    {[{ key: 'heroBachestic', label: 'Header Bachestic Sport' }, { key: 'heroElite', label: 'Header Elite Bachestic' }].map(({ key, label }) => (
                      <div key={key} className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">{label}</label>
                        <label className="relative flex flex-col items-center justify-center cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed border-zinc-800 hover:border-red-600 transition-all bg-black/40 aspect-video">
                          {(localSettings as any)[key] ? (
                            <>
                              <img src={(localSettings as any)[key]} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-all flex items-center justify-center">
                                <p className="text-[9px] font-black text-white uppercase tracking-widest">Cambiar foto</p>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-zinc-700">
                              <FileImage size={28} />
                              <p className="text-[8px] font-black uppercase">Subir imagen</p>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => setLocalSettings(prev => ({ ...prev, [key]: reader.result as string }));
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                        {(localSettings as any)[key] && (
                          <button type="button" onClick={() => setLocalSettings(prev => ({ ...prev, [key]: '' }))}
                            className="text-[8px] font-black text-red-600 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1">
                            <X size={10} /> Eliminar foto
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-zinc-900"><SaveButton /></div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALES ── */}
      <Modal isOpen={activeModal === 'gallery'} onClose={() => { setActiveModal(null); setGalleryPreview(''); setGalleryFile(null); }} title="Subir a Galería">
        <form onSubmit={handleGallerySubmit} className="space-y-6">
          <div className="relative group">
            {galleryPreview ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-black">
                <img src={galleryPreview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setGalleryPreview(''); setGalleryFile(null); }} className="absolute top-4 right-4 p-2 bg-black/80 rounded-full text-white hover:bg-red-600"><X size={16} /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed border-zinc-800 bg-black/40 cursor-pointer hover:border-red-600/50 transition-all">
                <div className="flex flex-col items-center gap-4 text-zinc-500">
                  <FileImage size={48} className="opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Click para seleccionar imagen</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
          <button disabled={!galleryFile || isUploading} className={`w-full py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 shadow-2xl transition-all flex items-center justify-center gap-3 ${!galleryFile || isUploading ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>
            {isUploading ? <><Activity className="animate-spin" size={18} />Procesando...</> : <><Plus size={18} />SUBIR A GALERÍA</>}
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'event'} onClose={() => setActiveModal(null)} title="Programar Evento">
        <form onSubmit={handleEventSubmit} className="space-y-5">
          <input required placeholder="NOMBRE DEL TORNEO / EVENTO" value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block">Fecha Inicio</label>
              <input required type="date" value={eventForm.startDate} onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} className="w-full bg-black border border-zinc-800 text-white p-4 rounded-2xl text-xs outline-none" />
            </div>
            <div>
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block">Fecha Fin</label>
              <input required type="date" value={eventForm.endDate} onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })} className="w-full bg-black border border-zinc-800 text-white p-4 rounded-2xl text-xs outline-none" />
            </div>
          </div>
          <select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value as any })} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-[10px] font-black uppercase">
            <option value="Torneo">Torneo</option><option value="Entrenamiento">Entrenamiento</option>
            <option value="Workshop">Workshop</option><option value="Meetup">Meetup</option>
          </select>
          <textarea placeholder="DESCRIPCIÓN DEL EVENTO" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs min-h-[100px] outline-none" />
          <textarea placeholder="NOTAS IMPORTANTES (OPCIONAL)" value={eventForm.notes} onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs outline-none" />
          <button className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 shadow-2xl">PUBLICAR EVENTO</button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'product'} onClose={() => {
        setActiveModal(null); setProductImagePreview(''); setEditingProduct(null);
        setProductForm({ name: '', description: '', price: 0, image: '', stock: 0, category: ProductCategory.OFFICIAL, sizes: ['S', 'M', 'L', 'XL'], segment: 'elite' });
      }} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleProductSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Nombre del Producto</label>
              <input required placeholder="EJ: JERSEY ELITE BLACKOUT" value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600" />
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Categoría del Producto</label>
              {dynCatsLoading ? (
                <div className="flex items-center gap-2 p-5 bg-black border border-zinc-800 rounded-2xl text-zinc-600">
                  <Activity className="animate-spin" size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cargando categorías...</span>
                </div>
              ) : activeCats.length === 0 ? (
                <div className="flex items-center justify-between p-5 bg-black border border-yellow-800/50 rounded-2xl">
                  <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Sin categorías activas</span>
                  <button type="button" onClick={() => { setActiveModal(null); setActiveTab('categories'); }}
                    className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-colors">
                    Ir a Categorías →
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <select value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full bg-black border border-zinc-800 text-white p-5 pl-12 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600 appearance-none">
                    {activeCats.map(cat => (
                      <option key={cat.id} value={cat.key_name}>
                        {cat.icon} {cat.label}{cat.segment !== 'both' ? ` (${cat.segment})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Precio ($)</label>
              <input required type="number" step="0.01" value={productForm.price}
                onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-2xl text-xs outline-none focus:border-red-600" />
            </div>
            <div>
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Stock Inicial</label>
              <input required type="number" value={productForm.stock}
                onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                className="w-full bg-black border border-zinc-800 text-white p-4 rounded-2xl text-xs outline-none focus:border-red-600" />
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Segmento</label>
              <select value={productForm.segment} onChange={e => setProductForm({ ...productForm, segment: e.target.value as any })}
                className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600">
                <option value="elite">Elite (Torneos)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Foto del Producto</label>
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 bg-black/40 rounded-3xl cursor-pointer hover:border-red-600 transition-all">
                {productImagePreview ? <img src={productImagePreview} alt="" className="w-32 h-32 object-cover rounded-xl" /> : <Upload size={32} className="text-zinc-700" />}
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'product')} className="hidden" />
              </label>
            </div>
          </div>
          <textarea placeholder="DESCRIPCIÓN COMERCIAL" value={productForm.description}
            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
            className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs min-h-[100px] outline-none focus:border-red-600" />
          <button className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 shadow-2xl transition-all">
            {editingProduct ? 'ACTUALIZAR PRODUCTO' : 'GUARDAR PRODUCTO'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'new_staff'} onClose={() => { setActiveModal(null); setEditingStaffId(null); setStaffForm({ name: '', pin: '' }); }} title={editingStaffId ? 'Editar Admin' : 'Nuevo Admin'}>
        <form onSubmit={handleStaffSubmit} className="space-y-6">
          <input required placeholder="NOMBRE" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl text-xs font-black outline-none focus:border-red-600" />
          <input required placeholder="PIN (4 DÍGITOS)" maxLength={4} value={staffForm.pin} onChange={e => setStaffForm({ ...staffForm, pin: e.target.value })} className="w-full bg-black border border-zinc-800 text-white p-6 rounded-2xl text-center text-3xl font-black outline-none focus:border-red-600" />
          <button className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95">GUARDAR</button>
        </form>
      </Modal>

      {/* ── MODAL DETALLE DE ORDEN ── */}
      <Modal
        isOpen={activeModal === 'order_detail'}
        onClose={() => { setActiveModal(null); setSelectedOrder(null); setOrderItems([]); }}
        title="Detalle del Pedido"
      >
        {selectedOrder && (
          <div className="space-y-6">

            {/* por esto: */}
            <div className="flex items-center gap-3">
              <div className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest border-2 ${getStatusStyle(selectedOrder.status)}`}>
                <span className="text-xl">{getStatusIcon(selectedOrder.status)}</span>
                {selectedOrder.status}
              </div>
              {selectedOrder.status === 'PAGADO' && (
                  <button
                    // Reemplaza el bloque onClick del botón Despachar por este:
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/orders/${selectedOrder.id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'DESPACHADO' }),
                        });
                        if (res.ok) {
                          // 1. Cierra el modal primero
                          setActiveModal(null);
                          setSelectedOrder(null);
                          setOrderItems([]);
                          // 2. Recarga órdenes del backend
                          await fetchOrders();
                          // 3. Ya no necesitas navegar a ninguna página —
                          //    filteredOrders se recalcula automáticamente con los datos frescos
                        }
                      } catch {}
                    }}
                    className="flex items-center gap-3 px-5 py-3 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white rounded-2xl transition-all shadow-lg shadow-blue-900/30 group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-white/15 border border-white/10 rounded-lg text-base shrink-0">
                      📦
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[9px] font-semibold uppercase tracking-widest opacity-70">
                        Marcar como
                      </span>
                      <span className="text-[13px] font-black uppercase tracking-wide">
                        Despachar
                      </span>
                    </div>
                    <span className="ml-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-lg">
                      →
                    </span>
                  </button>
                )}
            </div>
            <div className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div>
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Referencia del Pedido</p>
                <p className="text-[10px] font-mono text-zinc-300 break-all">{selectedOrder.id}</p>
              </div>
              {selectedOrder.wompi_transaction_id && (
                <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">ID Transacción Wompi</p>
                  <p className="text-[10px] font-mono text-green-400 break-all">{selectedOrder.wompi_transaction_id}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
                <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Fecha</p>
                  <p className="text-[10px] font-bold text-zinc-300">{new Date(selectedOrder.created_at || Date.now()).toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Método de Pago</p>
                  <p className="text-[10px] font-bold text-zinc-300">{selectedOrder.paymentMethod}</p>
                </div>
              </div>
            </div>
            <div className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-4">
              <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">Datos del Cliente</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0"><UserIcon size={14} className="text-zinc-500" /></div>
                  <div>
                    <p className="text-[8px] font-black text-zinc-600 uppercase">Nombre</p>
                    <p className="text-sm font-black text-white uppercase">{selectedOrder.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0"><Mail size={14} className="text-zinc-500" /></div>
                  <div>
                    <p className="text-[8px] font-black text-zinc-600 uppercase">Email</p>
                    <a href={`mailto:${selectedOrder.email}`} className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors">{selectedOrder.email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0"><PhoneIcon size={14} className="text-zinc-500" /></div>
                  <div>
                    <p className="text-[8px] font-black text-zinc-600 uppercase">Teléfono</p>
                    <a href={`tel:${selectedOrder.phone}`} className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors">{selectedOrder.phone}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"><Package size={14} className="text-zinc-500" /></div>
                  <div>
                    <p className="text-[8px] font-black text-zinc-600 uppercase">Dirección de Entrega</p>
                    <p className="text-sm font-bold text-white">{selectedOrder.address}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-zinc-900">
                <a href={`mailto:${selectedOrder.email}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">
                  <Mail size={13} />Email
                </a>
                <a href={`tel:${selectedOrder.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">
                  <PhoneIcon size={13} />Llamar
                </a>
                <a href={`https://wa.me/${selectedOrder.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-900/40 hover:bg-green-900/60 text-green-500 hover:text-green-300 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-green-900/50">
                  <PhoneIcon size={13} />WhatsApp
                </a>
              </div>
            </div>
            <div className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-4">
              <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">Productos del Pedido</p>
              {loadingItems ? (
                <div className="flex items-center justify-center py-6 gap-2 text-zinc-600">
                  <Activity className="animate-spin" size={16} />
                  <span className="text-[9px] font-black uppercase">Cargando...</span>
                </div>
              ) : orderItems.length === 0 ? (
                <p className="text-zinc-600 text-[10px] font-bold uppercase text-center py-4">Sin items registrados</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-950 rounded-xl p-4 border border-zinc-900">
                      <div className="flex-1">
                        <p className="text-sm font-black text-white uppercase">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[8px] font-black text-zinc-500 uppercase px-2 py-0.5 bg-zinc-900 rounded-lg">Talla: {item.selectedSize}</span>
                          <span className="text-[8px] font-black text-zinc-500 uppercase px-2 py-0.5 bg-zinc-900 rounded-lg">x{item.quantity}</span>
                        </div>
                      </div>
                      <p className="text-sm font-black text-red-500">${Number(item.price).toLocaleString('es-CO')}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total del Pedido</p>
                <p className="text-2xl font-black text-white">${Number(selectedOrder.total).toLocaleString('es-CO')}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;