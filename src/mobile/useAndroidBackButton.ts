import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type OverlayHandler = () => boolean; // Returns true if an overlay was closed

export function useAndroidBackButton(onCloseOverlay?: OverlayHandler) {
  const navigate = useNavigate();
  const location = useLocation();
  const closeOverlayRef = useRef(onCloseOverlay);

  useEffect(() => {
    closeOverlayRef.current = onCloseOverlay;
  }, [onCloseOverlay]);

  useEffect(() => {
    // Push dummy history entry to catch back button pressed
    window.history.pushState({ page: 'nex_app' }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Step 1: Try closing any open overlay/modal/drawer first
      if (closeOverlayRef.current && closeOverlayRef.current()) {
        // Re-push state so back history remains intact
        window.history.pushState({ page: 'nex_app' }, '', window.location.href);
        return;
      }

      // Step 2: Check if at root dashboard route
      if (location.pathname === '/dashboard' || location.pathname === '/') {
        // Root route: prevent accidental exit or navigate back gracefully
        window.history.pushState({ page: 'nex_app' }, '', window.location.href);
      } else {
        // Navigate back in React Router
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate, location.pathname]);
}
