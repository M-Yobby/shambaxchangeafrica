/**
 * Notification Helper Utilities
 * 
 * This module provides utility functions and templates for creating and managing
 * notifications throughout the shambaXchange platform. It includes a generic
 * notification creator and pre-built templates for common notification types.
 * 
 * Notification Types:
 * - order: New orders, order status updates
 * - message: Direct messages between users
 * - system: App-wide announcements, achievements, milestones
 * - weather: Weather alerts and warnings
 * - price: Market price changes and alerts
 * - streak: Daily login streak reminders and milestones
 * - challenge: Challenge completions and new challenge announcements
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Parameters for creating a notification
 * @interface CreateNotificationParams
 */
interface CreateNotificationParams {
  userId: string;  // Target user ID who will receive the notification
  type: 'order' | 'message' | 'system' | 'weather' | 'price' | 'streak' | 'challenge';
  title: string;   // Notification title (shown prominently)
  message: string; // Notification body text (detailed message)
  data?: any;      // Optional metadata attached to notification (for click handling, deep links, etc.)
}

/**
 * Create Notification
 * 
 * Generic function to insert a notification into the database.
 * Notifications are delivered via:
 * 1. In-app notification center (NotificationCenter component)
 * 2. Browser push notifications (if user has granted permission)
 * 3. Realtime updates (Supabase Realtime subscription)
 * 
 * @param {CreateNotificationParams} params - Notification configuration
 * @returns {Promise<boolean>} True if notification created successfully, false otherwise
 * 
 * @example
 * await createNotification({
 *   userId: 'user-123',
 *   type: 'order',
 *   title: 'New Order!',
 *   message: 'You have a new order for 50kg maize',
 *   data: { orderId: 'order-456', cropName: 'Maize' }
 * });
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) => {
  try {
    // Insert notification into database
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},  // Default to empty object if no data provided
      read: false,       // All new notifications start as unread
    });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * Notification Templates
 * 
 * Pre-built notification templates for common platform events.
 * These templates ensure consistent messaging and make it easy to send
 * notifications throughout the app without duplicating notification text.
 * 
 * Each template returns an object with title, message, and type properties
 * that can be directly passed to createNotification().
 * 
 * Usage Example:
 * const notif = NotificationTemplates.newOrder('John Doe', 'Maize');
 * await createNotification({ userId: sellerId, ...notif });
 */
export const NotificationTemplates = {
  /**
   * New Order Notification
   * Sent to sellers when a buyer places an order for their produce
   */
  newOrder: (buyerName: string, productName: string) => ({
    title: '🛒 New Order!',
    message: `${buyerName} wants to buy your ${productName}`,
    type: 'order' as const,
  }),

  /**
   * New Message Notification
   * Sent when a user receives a direct message from another user
   */
  newMessage: (senderName: string) => ({
    title: '💬 New Message',
    message: `${senderName} sent you a message`,
    type: 'message' as const,
  }),

  /**
   * Price Alert Notification
   * Sent when market price for a crop changes significantly (>10%)
   */
  priceAlert: (cropName: string, change: number) => ({
    title: '📈 Price Alert',
    message: `${cropName} price ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}%`,
    type: 'price' as const,
  }),

  /**
   * Weather Warning Notification
   * Sent for severe weather alerts (storms, droughts, etc.)
   */
  weatherWarning: (warning: string) => ({
    title: '⚠️ Weather Warning',
    message: warning,
    type: 'weather' as const,
  }),

  /**
   * Streak Reminder Notification
   * Sent daily to encourage users to maintain their login streak
   */
  streakReminder: (streakDays: number) => ({
    title: '🔥 Keep Your Streak!',
    message: `You're on a ${streakDays}-day streak! Check in today to continue`,
    type: 'streak' as const,
  }),

  /**
   * Challenge Completion Notification
   * Sent when user completes a farming challenge
   */
  challengeComplete: (challengeName: string, points: number) => ({
    title: '🏆 Challenge Complete!',
    message: `You completed "${challengeName}" and earned ${points} points!`,
    type: 'challenge' as const,
  }),

  /**
   * New Challenge Notification
   * Sent when new challenges become available
   */
  newChallenge: (challengeName: string) => ({
    title: '✨ New Challenge Available',
    message: `Try the new "${challengeName}" challenge!`,
    type: 'challenge' as const,
  }),

  /**
   * Harvest Reminder Notification
   * Sent when crops are approaching harvest date
   */
  harvestReminder: (cropName: string, daysLeft: number) => ({
    title: '🌾 Harvest Reminder',
    message: `Your ${cropName} is ready for harvest in ${daysLeft} days`,
    type: 'system' as const,
  }),

  /**
   * Level Up Notification
   * Sent when user earns enough points to level up
   * Triggers reward unlock based on gamification system
   */
  levelUp: (newLevel: number) => ({
    title: '⭐ Level Up!',
    message: `Congratulations! You reached Level ${newLevel}`,
    type: 'system' as const,
  }),

  /**
   * Referral Completion Notification
   * Sent when referred user becomes active (completes first action)
   * Referrer earns 100 points per successful referral
   */
  referralComplete: (count: number) => ({
    title: '🎉 Referral Complete!',
    message: `Your referral is now active. You earned 100 points! Total referrals: ${count}`,
    type: 'system' as const,
  }),
};
