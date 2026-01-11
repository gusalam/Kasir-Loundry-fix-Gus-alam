import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogOut } from 'lucide-react';

interface ExitConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmationDialog({ 
  open, 
  onConfirm, 
  onCancel 
}: ExitConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-[320px] rounded-2xl">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <LogOut className="h-7 w-7 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">
            Keluar Aplikasi?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Apakah Anda yakin ingin keluar dari aplikasi?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
          <AlertDialogCancel 
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl mt-0"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90"
          >
            Keluar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
