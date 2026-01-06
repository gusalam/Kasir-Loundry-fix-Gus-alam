import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export function useHapticFeedback() {
  const triggerHaptic = async (type: HapticType = 'light') => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'selection':
          await Haptics.selectionStart();
          await Haptics.selectionEnd();
          break;
      }
    } catch (error) {
      // Fallback to Web Vibration API
      if ('vibrate' in navigator) {
        const duration = type === 'heavy' ? 50 : type === 'medium' ? 30 : 15;
        navigator.vibrate(duration);
      }
    }
  };

  const impactLight = () => triggerHaptic('light');
  const impactMedium = () => triggerHaptic('medium');
  const impactHeavy = () => triggerHaptic('heavy');
  const notifySuccess = () => triggerHaptic('success');
  const notifyWarning = () => triggerHaptic('warning');
  const notifyError = () => triggerHaptic('error');
  const selectionChanged = () => triggerHaptic('selection');

  return {
    triggerHaptic,
    impactLight,
    impactMedium,
    impactHeavy,
    notifySuccess,
    notifyWarning,
    notifyError,
    selectionChanged,
  };
}
