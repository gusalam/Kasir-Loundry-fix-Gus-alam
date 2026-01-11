import { useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface UseExitConfirmationOptions {
  enabled?: boolean;
  exitPaths?: string[];
}

export function useExitConfirmation(options: UseExitConfirmationOptions = {}) {
  const { 
    enabled = true,
    exitPaths = ['/', '/login', '/admin/dashboard', '/kasir/dashboard']
  } = options;
  
  const location = useLocation();
  const navigate = useNavigate();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [lastBackPress, setLastBackPress] = useState(0);

  const isExitPath = exitPaths.includes(location.pathname);

  const handleConfirmExit = useCallback(() => {
    setShowExitDialog(false);
    App.exitApp();
  }, []);

  const handleCancelExit = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;

    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      if (isExitPath) {
        // On root/dashboard pages, show exit confirmation
        const now = Date.now();
        
        // Double tap to exit (within 2 seconds)
        if (now - lastBackPress < 2000) {
          setShowExitDialog(true);
        } else {
          setLastBackPress(now);
          // Show toast hint - we'll handle this in the component
        }
      } else if (canGoBack) {
        // Navigate back if possible
        navigate(-1);
      } else {
        // Show exit confirmation as fallback
        setShowExitDialog(true);
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [enabled, isExitPath, lastBackPress, navigate]);

  return {
    showExitDialog,
    handleConfirmExit,
    handleCancelExit,
    setShowExitDialog,
    isNative: Capacitor.isNativePlatform(),
  };
}
