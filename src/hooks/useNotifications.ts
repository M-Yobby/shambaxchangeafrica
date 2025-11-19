import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for managing browser push notifications.
 * 
 * Provides functionality to check browser support, request notification permissions,
 * register service workers, and display push notifications. This hook is essential
 * for the platform's engagement strategy, enabling alerts for orders, messages,
 * price changes, weather warnings, and streak reminders.
 * 
 * @returns {Object} An object containing:
 *   - `permission` {NotificationPermission} - Current notification permission state ('default', 'granted', or 'denied')
 *   - `isSupported` {boolean} - Whether the browser supports notifications and service workers
 *   - `requestPermission` {() => Promise<boolean>} - Function to request notification permission from user
 *   - `showNotification` {(title: string, options?: NotificationOptions) => Promise<void>} - Function to display a notification
 * 
 * @example
 * ```tsx
 * function NotificationButton() {
 *   const { permission, isSupported, requestPermission, showNotification } = useNotifications();
 *   
 *   if (!isSupported) {
 *     return <div>Notifications not supported in your browser</div>;
 *   }
 *   
 *   const handleEnableNotifications = async () => {
 *     const granted = await requestPermission();
 *     
 *     if (granted) {
 *       await showNotification('Welcome!', {
 *         body: 'You will now receive important farming updates',
 *         icon: '/icon.png'
 *       });
 *     }
 *   };
 *   
 *   return (
 *     <button onClick={handleEnableNotifications}>
 *       {permission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
 *     </button>
 *   );
 * }
 * ```
 * 
 * @remarks
 * - Automatically checks browser support on mount
 * - Registers service worker at `/sw.js` when permission is granted
 * - Includes default icon (`/icon-192x192.png`) and badge for notifications
 * - Shows toast feedback when permission is granted or denied
 * - Service worker enables offline functionality and background notifications
 * - Critical for daily engagement: weather alerts, price changes, order updates, streak reminders
 */
export const useNotifications = () => {
  // State for tracking notification permission status (default, granted, denied)
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  // State for tracking if browser supports notifications and service workers
  const [isSupported, setIsSupported] = useState(false);
  
  const { toast } = useToast();

  /**
   * Initialization Effect
   * Runs once on component mount to check browser support for notifications
   * and retrieve current permission status
   */
  useEffect(() => {
    // Check if both Notification API and Service Workers are supported by browser
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    // If supported, get current permission status
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  /**
   * Request Notification Permission
   * 
   * Requests permission from user to show push notifications.
   * If granted, registers service worker for background notifications.
   * 
   * @returns {Promise<boolean>} True if permission granted, false otherwise
   */
  const requestPermission = async () => {
    // Early return if browser doesn't support notifications
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Notifications are not supported in this browser',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Request permission from user (triggers browser prompt)
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Permission granted - register service worker for background notifications
        await registerServiceWorker();
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications',
        });
        return true;
      } else {
        // Permission denied or dismissed
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  /**
   * Register Service Worker
   * 
   * Registers the service worker (/sw.js) which enables:
   * - Background notifications when app is closed
   * - Offline functionality
   * - Push notification handling
   * 
   * @returns {Promise<ServiceWorkerRegistration>} The service worker registration
   * @throws {Error} If registration fails
   */
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Register service worker at /sw.js with root scope
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
  };

  /**
   * Show Notification
   * 
   * Displays a push notification to the user via the service worker.
   * Only works if permission has been granted.
   * 
   * @param {string} title - The notification title
   * @param {NotificationOptions} options - Optional notification configuration (body, icon, data, etc.)
   * 
   * Common options:
   * - body: Main notification text
   * - icon: Icon image URL
   * - tag: Unique identifier for notification grouping
   * - data: Custom data to attach to notification
   */
  const showNotification = async (title: string, options?: NotificationOptions) => {
    // Early return if permission not granted
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      
      // Show notification through service worker (works even when app is closed)
      await registration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Return notification management interface
  return {
    permission,        // Current permission status
    isSupported,       // Browser support flag
    requestPermission, // Function to request permission
    showNotification,  // Function to display notification
  };
};
