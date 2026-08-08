import React from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileDrawer } from './MobileDrawer';
import { BottomNavigation } from './BottomNavigation';
import { FloatingActionButton } from './FloatingActionButton';
import { useAndroidBackButton } from './useAndroidBackButton';
import { useUIStore } from '../stores/uiStore';

interface MobileNavigationProps {
  onOpenSearch?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ onOpenSearch }) => {
  const { mobileMenuOpen, setMobileMenuOpen, setGlobalSearchOpen } = useUIStore();

  const handleSearch = onOpenSearch || (() => setGlobalSearchOpen(true));

  // Android hardware back button handler
  useAndroidBackButton(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      return true;
    }
    return false;
  });

  return (
    <>
      <MobileHeader onOpenSearch={handleSearch} />
      <MobileDrawer />
      <FloatingActionButton />
      <BottomNavigation />
    </>
  );
};
