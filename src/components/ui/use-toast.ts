
import { toast as sonnerToast } from 'sonner';

type ToastOptions = {
  description?: string;
  variant?: 'default' | 'destructive';
  [key: string]: any;
};

// Create a wrapper for the toast function to maintain compatibility with both
// the Shadcn toast API and Sonner toast API
export const toast = (titleOrOptions: string | ToastOptions, options?: ToastOptions) => {
  // If the first argument is a string, it's the title
  if (typeof titleOrOptions === 'string') {
    return sonnerToast(titleOrOptions, options);
  }
  // If it's an object with a title property, extract title and pass the rest as options
  else if (titleOrOptions && typeof titleOrOptions === 'object' && 'title' in titleOrOptions) {
    const { title, ...restOptions } = titleOrOptions as { title: string; [key: string]: any };
    return sonnerToast(title, restOptions);
  }
  // Fallback for any other cases
  else {
    return sonnerToast(String(titleOrOptions), options);
  }
};

export { useToast } from '@/hooks/use-toast';
