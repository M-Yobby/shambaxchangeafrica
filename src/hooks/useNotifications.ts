/**
 * useNotifications Hook
 * 
 * Custom React hook that manages browser push notifications for the application.
 * This hook handles notification permissions, service worker registration, and
 * displaying push notifications to users.
 * 
 * Key Features:
 * - Detects browser support for notifications
 * - Requests and manages notification permissions
 * - Registers service worker for background notifications
 * - Displays push notifications with custom content
 * 
 * @returns {Object} Notification management functions and state
 * @property {NotificationPermission} permission - Current notification permission status ('default', 'granted', 'denied')
 * @property {boolean} isSupported - Whether browser supports notifications and service workers
 * @property {Function} requestPermission - Requests notification permission from user
 * @property {Function} showNotification - Displays a push notification
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
