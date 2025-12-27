import { cn } from '@/lib/utils';

interface MobileStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  diterima: { label: 'Diterima', className: 'bg-info/20 text-info border-info/30' },
  diproses: { label: 'Diproses', className: 'bg-warning/20 text-warning border-warning/30' },
  qc: { label: 'QC', className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700' },
  selesai: { label: 'Selesai', className: 'bg-success/20 text-success border-success/30' },
  diambil: { label: 'Diambil', className: 'bg-muted text-muted-foreground border-border' },
  belum_lunas: { label: 'Belum Lunas', className: 'bg-danger/20 text-danger border-danger/30' },
  dp: { label: 'DP', className: 'bg-warning/20 text-warning border-warning/30' },
  lunas: { label: 'Lunas', className: 'bg-success/20 text-success border-success/30' },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function MobileStatusBadge({ status, size = 'md' }: MobileStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' };
  
  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full border',
      config.className,
      sizeStyles[size]
    )}>
      {config.label}
    </span>
  );
}
