import { useState, useEffect, useCallback } from 'react';

export interface MobileLayoutState {
  isMobile: boolean; // < 768px
  isTablet: boolean; // >= 768px && < 1024px
  isDesktop: boolean; // >= 1024px
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  hasTouch: boolean;
}

export function useMobileLayout(): MobileLayoutState {
  const [state, setState] = useState<MobileLayoutState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1280,
        screenHeight: 800,
        orientation: 'landscape',
        hasTouch: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      screenWidth: width,
      screenHeight: height,
      orientation: width >= height ? 'landscape' : 'portrait',
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
  });

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setState({
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      screenWidth: width,
      screenHeight: height,
      orientation: width >= height ? 'landscape' : 'portrait',
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  return state;
}
