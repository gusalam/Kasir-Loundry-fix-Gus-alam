import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Actually check connectivity by pinging a resource
const checkRealConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a small resource with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/logo.png', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true); // Assume online initially
  const [showStatus, setShowStatus] = useState(false);

  const verifyConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setShowStatus(true);
      return;
    }
    
    // Double-check with actual request
    const reallyOnline = await checkRealConnectivity();
    setIsOnline(reallyOnline);
    
    if (!reallyOnline) {
      setShowStatus(true);
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      // Verify before showing online
      const reallyOnline = await checkRealConnectivity();
      setIsOnline(reallyOnline);
      
      if (reallyOnline) {
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check - only verify if browser says offline
    if (!navigator.onLine) {
      setShowStatus(true);
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [verifyConnection]);

  // Always show if offline, otherwise only show temporarily when coming back online
  if (!showStatus && isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300",
        isOnline
          ? "bg-success/10 text-success border border-success/20"
          : "bg-danger/10 text-danger border border-danger/20 animate-pulse"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
    </div>
  );
};
