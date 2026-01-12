import { motion } from 'framer-motion';
import { Fingerprint, ScanFace, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BiometryType } from '@/hooks/useBiometricAuth';

interface BiometricLoginButtonProps {
  biometryType: BiometryType;
  isLoading: boolean;
  onClick: () => void;
}

export function BiometricLoginButton({ biometryType, isLoading, onClick }: BiometricLoginButtonProps) {
  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-6 h-6 animate-spin" />;
    }
    
    switch (biometryType) {
      case 'faceId':
        return <ScanFace className="w-6 h-6" />;
      case 'fingerprint':
      default:
        return <Fingerprint className="w-6 h-6" />;
    }
  };

  const getLabel = () => {
    switch (biometryType) {
      case 'faceId':
        return 'Login dengan Face ID';
      case 'fingerprint':
        return 'Login dengan Sidik Jari';
      case 'iris':
        return 'Login dengan Iris';
      default:
        return 'Login Biometrik';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={isLoading}
        className="w-full h-14 rounded-xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-3"
      >
        <div className="p-1.5 rounded-full bg-primary/10 text-primary">
          {getIcon()}
        </div>
        <span className="font-medium text-foreground/80">{getLabel()}</span>
      </Button>
    </motion.div>
  );
}
