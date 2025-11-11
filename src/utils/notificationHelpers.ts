import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  type: 'order' | 'message' | 'system' | 'weather' | 'price' | 'streak' | 'challenge';
  title: string;
  message: string;
  data?: any;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
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

// Notification templates
export const NotificationTemplates = {
  newOrder: (buyerName: string, productName: string) => ({
    title: '🛒 New Order!',
    message: `${buyerName} wants to buy your ${productName}`,
    type: 'order' as const,
  }),

  newMessage: (senderName: string) => ({
    title: '💬 New Message',
    message: `${senderName} sent you a message`,
    type: 'message' as const,
  }),

  priceAlert: (cropName: string, change: number) => ({
    title: '📈 Price Alert',
    message: `${cropName} price ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}%`,
    type: 'price' as const,
  }),

  weatherWarning: (warning: string) => ({
    title: '⚠️ Weather Warning',
    message: warning,
    type: 'weather' as const,
  }),

  streakReminder: (streakDays: number) => ({
    title: '🔥 Keep Your Streak!',
    message: `You're on a ${streakDays}-day streak! Check in today to continue`,
    type: 'streak' as const,
  }),

  challengeComplete: (challengeName: string, points: number) => ({
    title: '🏆 Challenge Complete!',
    message: `You completed "${challengeName}" and earned ${points} points!`,
    type: 'challenge' as const,
  }),

  newChallenge: (challengeName: string) => ({
    title: '✨ New Challenge Available',
    message: `Try the new "${challengeName}" challenge!`,
    type: 'challenge' as const,
  }),

  harvestReminder: (cropName: string, daysLeft: number) => ({
    title: '🌾 Harvest Reminder',
    message: `Your ${cropName} is ready for harvest in ${daysLeft} days`,
    type: 'system' as const,
  }),

  levelUp: (newLevel: number) => ({
    title: '⭐ Level Up!',
    message: `Congratulations! You reached Level ${newLevel}`,
    type: 'system' as const,
  }),

  referralComplete: (count: number) => ({
    title: '🎉 Referral Complete!',
    message: `Your referral is now active. You earned 100 points! Total referrals: ${count}`,
    type: 'system' as const,
  }),
};
