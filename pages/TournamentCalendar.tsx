
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronRight, CheckCircle, Trophy, Zap, GraduationCap, UsersRound, StickyNote, Loader2 } from 'lucide-react';
import { EliteEvent } from '../types';

const TournamentCalendar: React.FC = () => {
  const { events, registerTeam, isLoading } = useApp(); // CALENDARIO ACA: Usando isLoading del contexto
  const [selectedEvent, setSelectedEvent] = useState<EliteEvent | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    teamName: '',
    contactName: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    registerTeam({
      tournamentId: selectedEvent.id,
      ...formData
    });
    
    setIsSuccess(true);
    setFormData({ teamName: '', contactName: '', email: '', phone: '' });
    
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedEvent(null);
    }, 3000);
  };

  // CALENDARIO ACA: Lógica visual de iconos por tipo de evento
  const getIcon = (type: string) => {
    switch(type) {
      case 'Torneo': return <Trophy size={16} />;
      case 'Entrenamiento': return <Zap size={16} />;
      case 'Workshop': return <GraduationCap size={16} />;
      case 'Meetup': return <UsersRound size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  const getColors = (type: string) => {
    switch(type) {
      case 'Torneo': return 'bg-red-600 text-white';
      case 'Entrenamiento': return 'bg-blue-600 text-white';
      case 'Workshop': return 'bg-green-600 text-white';
      default: return 'bg-zinc-700 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="text-red-600 animate-spin mb-4" size={48} />
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Cargando Agenda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-32 md:py-40 animate-in fade-in duration-700">
       <div className="mb-16">
          <h2 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            PRÓXIMOS <span className="text-red-600">EVENTOS</span>
          </h2>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Agenda oficial de la comunidad Bachestic Sport</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* CALENDARIO ACA: Listado de Eventos Dinámicos */}
          <div className="lg:col-span-2 space-y-8">
            {events.length === 0 ? (
              <div className="bg-zinc-900/50 p-24 rounded-[3.5rem] text-center border border-zinc-800">
                <Calendar size={64} className="mx-auto text-zinc-800 mb-6" />
                <p className="text-zinc-500 font-black uppercase text-xs tracking-widest italic">No hay eventos programados en este momento.</p>
              </div>
            ) : (
              events.map((e) => (
                <div 
                  key={e.id} 
                  className={`group glass-card p-10 rounded-[3rem] border transition-all hover:border-red-600 hover:shadow-2xl hover:shadow-red-900/10 ${selectedEvent?.id === e.id ? 'border-red-600 bg-zinc-900/40' : 'border-zinc-800'}`}
                >
                  <div className="flex flex-col gap-8">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex gap-8 items-center">
                           <div className="bg-black/50 backdrop-blur-md p-6 rounded-[2rem] text-center min-w-[110px] border border-zinc-800 shadow-xl group-hover:border-red-900/30 transition-all">
                              <span className="block text-red-600 font-black text-4xl leading-none italic">{new Date(e.startDate).getDate()}</span>
                              <span className="block text-zinc-500 text-[10px] font-black uppercase mt-2 tracking-[0.2em]">{new Date(e.startDate).toLocaleString('es-ES', { month: 'short' }).toUpperCase()}</span>
                           </div>
                           <div>
                             <div className="flex items-center gap-2 mb-2">
                               <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-2 ${getColors(e.type)}`}>
                                 {getIcon(e.type)} {e.type}
                               </span>
                             </div>
                             <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter group-hover:text-red-600 transition-colors leading-tight">{e.category}</h3>
                             <p className="text-zinc-500 text-sm mt-2 font-medium max-w-md leading-relaxed">
                               Del {new Date(e.startDate).toLocaleDateString()} al {new Date(e.endDate).toLocaleDateString()}<br/>
                               {e.description}
                             </p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                           {e.type === 'Torneo' && e.status === 'Abierto' ? (
                             <button 
                               onClick={() => { setSelectedEvent(e); setIsSuccess(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                               className="bg-red-600 hover:bg-white hover:text-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap active:scale-95 flex items-center gap-3 shadow-xl"
                             >
                               Inscribirse <ChevronRight size={18} />
                             </button>
                           ) : (
                             <div className="px-8 py-4 border border-zinc-800 rounded-2xl text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-zinc-950/50">
                               {e.status === 'Cerrado' ? 'Cupos Llenos' : 'Entrada Libre'}
                             </div>
                           )}
                        </div>
                     </div>
                     {e.notes && (
                       <div className="bg-red-600/5 border border-red-600/20 p-6 rounded-[2rem] flex items-start gap-4">
                          <StickyNote size={20} className="text-red-500 mt-1" />
                          <div>
                             <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block mb-1">Nota del Organizador</span>
                             <p className="text-zinc-300 text-xs font-bold leading-relaxed">{e.notes}</p>
                          </div>
                       </div>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* CALENDARIO ACA: Lateral de Inscripción */}
          <div className="lg:col-span-1 h-fit sticky top-40">
            <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              {isSuccess ? (
                <div className="py-24 text-center animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                    <CheckCircle size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">¡INSCRITO!</h3>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Recibirás un correo de confirmación.</p>
                </div>
              ) : selectedEvent ? (
                <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right-8 duration-500">
                  <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-[2rem] mb-8">
                    <p className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-2">Inscripción para:</p>
                    <p className="text-white text-xl font-black uppercase italic tracking-tighter leading-tight">{selectedEvent.category}</p>
                  </div>
                  <div className="space-y-4">
                    <input required type="text" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl outline-none focus:border-red-600 transition-colors" placeholder="NOMBRE DEL EQUIPO" />
                    <input required type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl outline-none focus:border-red-600 transition-colors" placeholder="CAPITÁN / RESPONSABLE" />
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black border border-zinc-800 text-white p-5 rounded-2xl outline-none focus:border-red-600 transition-colors" placeholder="WHATSAPP DE CONTACTO" />
                  </div>
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase py-6 rounded-[2rem] transition-all shadow-2xl active:scale-95 text-[11px] tracking-[0.3em] mt-8">
                    CONFIRMAR CUPO
                  </button>
                  <button type="button" onClick={() => setSelectedEvent(null)} className="w-full text-zinc-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                </form>
              ) : (
                <div className="text-center py-24 px-6 border border-zinc-900 rounded-[2.5rem]">
                  <Trophy className="w-12 h-12 text-zinc-800 mx-auto mb-10" />
                  <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">Selecciona un torneo de la lista para inscribir a tu equipo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default TournamentCalendar;