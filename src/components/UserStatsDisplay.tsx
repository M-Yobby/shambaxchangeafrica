import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserStats {
  streak_days: number;
  total_points: number;
  level: number;
  badges: any;
}

export const UserStatsDisplay = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    updateStreak();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stats:', error);
        return;
      }

      if (!data) {
        // Create initial stats
        const { data: newStats } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            streak_days: 1,
            total_points: 0,
            level: 1,
            last_login: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (newStats) {
          setStats({
            streak_days: newStats.streak_days,
            total_points: newStats.total_points,
            level: newStats.level,
            badges: newStats.badges
          });
        } else {
          setStats({ streak_days: 1, total_points: 0, level: 1, badges: [] });
        }
      } else {
        setStats({
          streak_days: data.streak_days,
          total_points: data.total_points,
          level: data.level,
          badges: data.badges
        });
      }
    } catch (error) {
      console.error('Error in fetchStats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('update_streak', { p_user_id: user.id });
      await fetchStats();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="font-semibold">{stats.streak_days}</span>
        <span className="text-xs text-muted-foreground">day streak</span>
      </Badge>
      
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <Star className="h-4 w-4 text-yellow-500" />
        <span className="font-semibold">{stats.total_points}</span>
        <span className="text-xs text-muted-foreground">points</span>
      </Badge>
      
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <span className="font-semibold">Level {stats.level}</span>
      </Badge>
    </div>
  );
};