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
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <Card className="p-4 max-w-sm shadow-lg border-primary/20">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Stay Updated</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get instant alerts for orders, messages, weather warnings, and daily streak reminders
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEnable}>
                Enable Notifications
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
