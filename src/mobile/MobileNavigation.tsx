import React from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileDrawer } from './MobileDrawer';
import { BottomNavigation } from './BottomNavigation';
import { useAndroidBackButton } from './useAndroidBackButton';
import { useUIStore } from '../stores/uiStore';

interface MobileNavigationProps {
  onOpenSearch?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ onOpenSearch }) => {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  // Android hardware back button handler
  useAndroidBackButton(() => {
    if (isMobileMenuOpen) {
      setMobileMenuOpen(false);
      return true;
    }
    return false;
  });

  return (
    <>
      <MobileHeader onOpenSearch={onOpenSearch} />
      <MobileDrawer />
      <BottomNavigation />
    </>
  );
};
