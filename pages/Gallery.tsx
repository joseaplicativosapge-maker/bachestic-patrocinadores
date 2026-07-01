import React, { useState, useEffect, useCallback } from 'react';
import { ImageIcon, X, ChevronLeft, ChevronRight, FolderOpen, Images } from 'lucide-react';

interface GalleryImage {
  id: number;
  url: string;
  project_id: number | null;
}

interface GalleryProject {
  id: number;
  name: string;
  description?: string;
  cover_image?: string;
  images: GalleryImage[];
}

const Gallery: React.FC = () => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [unassigned, setUnassigned] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [activeProject, setActiveProject] = useState<GalleryProject | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE + '/api';

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/gallery/projects`).then(r => r.json()),
      fetch(`${API_BASE}/gallery`).then(r => r.json()),
    ])
      .then(([projectsData, allImages]: [GalleryProject[], GalleryImage[]]) => {
        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setUnassigned(allImages.filter(img => img.project_id === null));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openProject = (project: GalleryProject) => {
    setActiveProject(project);
    setCarouselIndex(0);
  };

  const closeModal = () => {
    setActiveProject(null);
    setCarouselIndex(0);
  };

  const prev = useCallback(() => {
    if (!activeProject) return;
    setCarouselIndex(i => Math.max(0, i - 1));
  }, [activeProject]);

  const next = useCallback(() => {
    if (!activeProject) return;
    setCarouselIndex(i => Math.min(activeProject.images.length - 1, i + 1));
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeProject, next, prev]);

  const projectsWithPhotos = projects.filter(p => p.images?.length > 0);

  // Unassigned treated as a virtual project
  const hasUnassigned = unassigned.length > 0;
  const totalImages = projects.reduce((acc, p) => acc + (p.images?.length ?? 0), 0) + unassigned.length;
  const isEmpty = !loading && totalImages === 0;

  const getCover = (project: GalleryProject) =>
    project.cover_image || project.images?.[0]?.url || '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 md:py-40">

      {/* ── MODAL CAROUSEL ─────────────────────────────────── */}
      {activeProject && activeProject.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center"
          onClick={closeModal}
        >
          {/* Header */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-10"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <p className="text-white font-black uppercase tracking-widest text-sm leading-none">
                {activeProject.name}
              </p>
              {activeProject.description && (
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {activeProject.description}
                </p>
              )}
            </div>
            <button
              className="p-3 bg-zinc-900 hover:bg-red-600 text-white rounded-2xl transition-all"
              onClick={closeModal}
            >
              <X size={18} />
            </button>
          </div>

          {/* Main image */}
          <div
            className="flex items-center justify-center w-full h-full px-20 py-24"
            onClick={e => e.stopPropagation()}
          >
            <img
              key={activeProject.images[carouselIndex].id}
              src={activeProject.images[carouselIndex].url}
              alt=""
              className="max-h-[75vh] max-w-full object-contain rounded-3xl shadow-2xl"
              style={{ animation: 'fadeIn 0.25s ease' }}
            />
          </div>

          {/* Prev / Next */}
          {carouselIndex > 0 && (
            <button
              className="absolute left-5 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/80 hover:bg-red-600 text-white rounded-2xl transition-all z-10"
              onClick={e => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {carouselIndex < activeProject.images.length - 1 && (
            <button
              className="absolute right-5 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/80 hover:bg-red-600 text-white rounded-2xl transition-all z-10"
              onClick={e => { e.stopPropagation(); next(); }}
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Thumbnails strip */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-6 py-4 overflow-x-auto"
            onClick={e => e.stopPropagation()}
          >
            {activeProject.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCarouselIndex(i)}
                className={`flex-shrink-0 w-14 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                  i === carouselIndex
                    ? 'border-red-600 opacity-100 scale-110'
                    : 'border-transparent opacity-40 hover:opacity-70'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Counter */}
          <div className="absolute bottom-20 right-6 bg-zinc-900/80 px-4 py-2 rounded-2xl pointer-events-none">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              {carouselIndex + 1} / {activeProject.images.length}
            </p>
          </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="mb-16">
        <h2 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">
          Registro <span className="text-red-600">Fotográfico</span>
        </h2>
        <p className="text-zinc-500 mt-4 font-bold tracking-[0.3em] uppercase text-xs">
          Momentos capturados en la cancha
        </p>
      </div>

      {/* ── STATES ─────────────────────────────────────────── */}
      {loading ? (
        <div className="py-40 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isEmpty ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6 bg-zinc-900/20 rounded-[4rem] border border-dashed border-zinc-800">
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center">
            <ImageIcon size={36} className="text-zinc-700" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-white font-black uppercase tracking-widest text-sm">
              Galería en construcción
            </p>
            <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">
              Pronto encontrarás aquí los mejores momentos
            </p>
          </div>
        </div>
      ) : (
        /* ── PROJECT GRID ──────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Named projects */}
          {projectsWithPhotos.map(project => (
            <button
              key={project.id}
              onClick={() => openProject(project)}
              className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 hover:border-red-600 transition-all duration-500 cursor-pointer text-left aspect-[4/3]"
            >
              {/* Cover image */}
              {getCover(project) ? (
                <img
                  src={getCover(project)}
                  alt={project.name}
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FolderOpen size={48} className="text-zinc-700" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Red tint on hover */}
              <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Photo count badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <Images size={12} className="text-red-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {project.images.length}
                </span>
              </div>

              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-black uppercase tracking-widest text-sm leading-none group-hover:text-red-400 transition-colors">
                  {project.name}
                </p>
                {project.description && (
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-2 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                    Ver álbum →
                  </span>
                </div>
              </div>
            </button>
          ))}

          {/* Unassigned photos card */}
          {hasUnassigned && (
            <button
              onClick={() => openProject({
                id: -1,
                name: 'Sin categoría',
                description: 'Fotos sin proyecto asignado',
                images: unassigned,
              })}
              className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 hover:border-red-600 transition-all duration-500 cursor-pointer text-left aspect-[4/3]"
            >
              {unassigned[0]?.url ? (
                <img
                  src={unassigned[0].url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon size={48} className="text-zinc-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <Images size={12} className="text-red-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {unassigned.length}
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-black uppercase tracking-widest text-sm leading-none group-hover:text-red-400 transition-colors">
                  Sin categoría
                </p>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                  Fotos sin proyecto asignado
                </p>
                <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                    Ver álbum →
                  </span>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Gallery;