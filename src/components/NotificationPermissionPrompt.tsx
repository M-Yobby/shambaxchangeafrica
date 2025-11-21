/**
 * NOTIFICATION PERMISSION PROMPT
 * 
 * Floating prompt that appears after 3 seconds to request browser notification permissions.
 * Only shows if notifications are supported and permission hasn't been granted or denied.
 * 
 * @component
 * @example
 * ```tsx
 * <NotificationPermissionPrompt />
 * ```
 */

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { permission, isSupported, requestPermission } = useNotifications();

  useEffect(() => {
    // Show prompt if notifications are supported and permission hasn't been decided
    if (isSupported && permission === 'default') {
      // Wait a bit before showing the prompt to not overwhelm the user
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 max-w-sm">
      <Card className="p-4 shadow-lg border-primary/20 relative">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-start gap-3 pr-8">
          <div className="bg-primary/10 p-2 rounded-full shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Stay Updated</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get instant alerts for orders, messages, weather warnings, and daily streak reminders
            </p>
            <Button size="sm" onClick={handleEnable} className="w-full sm:w-auto">
              Enable Notifications
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
