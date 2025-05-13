
import { toast as sonnerToast } from 'sonner';

// Create a wrapper for the toast function to maintain compatibility
export const toast = (title: string, options?: any) => {
  return sonnerToast(title, options);
};

export { useToast } from '@/hooks/use-toast';
