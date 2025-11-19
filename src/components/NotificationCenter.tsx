/**
 * NotificationCenter Component
 * 
 * Displays a bell icon with badge showing unread notification count.
 * Clicking opens a dropdown showing recent notifications with ability to:
 * - Mark individual notifications as read
 * - Mark all notifications as read
 * - View notification details
 * 
 * Features:
 * - Realtime updates via Supabase Realtime subscription
 * - Browser push notifications when new notifications arrive
 * - Auto-refresh notification list on new insertions
 * - Icon-based notification categorization
 * - Scrollable notification list (last 10)
 */

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";

// Notification data structure from database
interface Notification {
  id: string;
  type: string;      // Notification category (order, message, system, etc.)
  title: string;     // Notification heading
  message: string;   // Notification body text
  read: boolean;     // Read/unread status
  created_at: string; // Timestamp
}

export const NotificationCenter = () => {
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showNotification, permission } = useNotifications();

  /**
   * Initialization Effect
   * Sets up notification fetching and realtime subscription on component mount
   */
  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications();
    
    // Set up Supabase Realtime subscription for instant updates
    // Listens for new notification insertions and triggers browser notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',              // Listen for new notifications
          schema: 'public',
          table: 'notifications'
        },
        async (payload) => {
          // Refresh notification list when new notification arrives
          await fetchNotifications();
          
          // Show browser push notification if user has granted permission
          if (permission === 'granted') {
            const newNotif = payload.new as Notification;
            showNotification(newNotif.title, {
              body: newNotif.message,
              tag: newNotif.type,
              data: { url: getNotificationUrl(newNotif.type) },
            });
          }
        }
      )
      .subscribe();

    // Cleanup: unsubscribe from realtime channel on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationUrl = (type: string) => {
    switch (type) {
      case 'message':
        return '/orders';
      case 'order':
        return '/orders';
      case 'system':
        return '/dashboard';
      default:
        return '/';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return '🌤️';
      case 'price':
        return '💰';
      case 'social':
        return '👥';
      case 'order':
        return '📦';
      case 'challenge':
        return '🏆';
      default:
        return '📢';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};