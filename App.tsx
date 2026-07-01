
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Store from './pages/Store';
import TournamentCalendar from './pages/TournamentCalendar';
import Gallery from './pages/Gallery';
import AdminDashboard from './pages/AdminDashboard';
import PaymentResult from './pages/PaymentResult';
import SponsorMarketing from './pages/SponsorMarketing';
import CartSidebar from './components/CartSidebar';
import AdminLogin from './components/AdminLogin';
import { MessageCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { adminUsers } = useApp();
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.pathname === '/pago-resultado') return 'pago-resultado';
    return 'home';
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);

  const navigateTo = (page: string) => {
    if (page === 'admin' && !isAdminAuthenticated) {
      setShowPinScreen(true);
      return;
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <Home onNavigate={navigateTo} />;
      case 'tienda': return <Store />;
      case 'torneos': return <TournamentCalendar />;
      case 'galeria': return <Gallery />;
      case 'pago-resultado': return <PaymentResult onNavigate={navigateTo} />;
      case 'patrocinadores': return <SponsorMarketing />;
      case 'admin': return isAdminAuthenticated ? <AdminDashboard onLogout={handleLogout} /> : <Home onNavigate={navigateTo} />;
      default: return <Home onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-700 bg-[#0d0d0d] text-white selection:bg-red-600">
      <Navbar
        onCartToggle={() => setIsCartOpen(true)}
        onNavigate={navigateTo}
        currentPage={currentPage}
      />

      <main className={`flex-grow ${currentPage === 'admin' ? 'pt-20' : ''}`}>
        {renderPage()}
      </main>

      {showPinScreen && (
        <AdminLogin
          adminUsers={adminUsers}
          onSuccess={() => { setIsAdminAuthenticated(true); setShowPinScreen(false); setCurrentPage('admin'); }}
          onCancel={() => setShowPinScreen(false)}
        />
      )}

      <a
        href="https://wa.me/573228942867"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[90] p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90 bg-red-600"
      >
        <MessageCircle size={32} color="white" fill="white" />
      </a>

      <footer className="bg-[#050505] border-t border-zinc-900 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-3xl font-black italic tracking-tighter mb-4 block text-red-600">
            ELITE SPORTS URBAN HUB
          </span>
          <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em]">&copy; 2026 ELITE SPORTS URBAN HUB. TODOS LOS DERECHOS RESERVADOS.</p>
        </div>
      </footer>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onNavigate={navigateTo} />
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
