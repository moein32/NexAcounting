import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { BottomNav } from './BottomNav';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { useAuthStore } from '../../stores/authStore';
import { NotificationService } from '../../notifications';

export function MainLayout() {
  const { currentBusiness } = useAuthStore();

  useEffect(() => {
    if (!currentBusiness?.id) return;

    NotificationService.initScheduler(currentBusiness.id);
  }, [currentBusiness?.id]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Slide-in Drawer */}
      <MobileDrawer />

      {/* Global Search Modal */}
      <GlobalSearchModal />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 lg:pb-0">
        <Header />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}
