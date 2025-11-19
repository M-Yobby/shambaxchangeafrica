import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Star, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserStats {
  streak_days: number;
  total_points: number;
  level: number;
  badges: any;
  streak_milestones: any;
  featured_until: string | null;
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
            badges: newStats.badges,
            streak_milestones: newStats.streak_milestones || [],
            featured_until: newStats.featured_until
          });
        } else {
          setStats({ 
            streak_days: 1, 
            total_points: 0, 
            level: 1, 
            badges: [],
            streak_milestones: [],
            featured_until: null
          });
        }
      } else {
        setStats({
          streak_days: data.streak_days,
          total_points: data.total_points,
          level: data.level,
          badges: data.badges,
          streak_milestones: data.streak_milestones || [],
          featured_until: data.featured_until
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

  const getStreakBadgeColor = () => {
    const milestones = Array.isArray(stats.streak_milestones) ? stats.streak_milestones : [];
    if (milestones.includes('90_day')) return 'text-purple-500';
    if (milestones.includes('30_day')) return 'text-blue-500';
    if (milestones.includes('7_day')) return 'text-orange-500';
    return 'text-orange-400';
  };

  const getStreakTooltip = () => {
    const milestones = Array.isArray(stats.streak_milestones) ? stats.streak_milestones : [];
    const achievedMilestones = [];
    if (milestones.includes('7_day')) achievedMilestones.push('Week Warrior 🔥');
    if (milestones.includes('30_day')) achievedMilestones.push('Month Master 🌟');
    if (milestones.includes('90_day')) achievedMilestones.push('Dedicated Farmer 💎');
    
    if (achievedMilestones.length === 0) {
      const nextMilestone = stats.streak_days < 7 ? 7 : stats.streak_days < 30 ? 30 : 90;
      const daysRemaining = nextMilestone - stats.streak_days;
      return `${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} to ${nextMilestone}-day milestone!`;
    }
    
    return achievedMilestones.join(' • ');
  };

  const isFeatured = stats.featured_until && new Date(stats.featured_until) > new Date();
  const milestones = Array.isArray(stats.streak_milestones) ? stats.streak_milestones : [];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`flex items-center gap-1.5 px-3 py-1.5 ${
                milestones.length > 0 ? 'ring-2 ring-offset-1 ring-orange-500/50' : ''
              }`}
            >
              <Flame className={`h-4 w-4 ${getStreakBadgeColor()}`} />
              <span className="font-semibold">{stats.streak_days}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
              {milestones.length > 0 && (
                <Award className="h-3 w-3 ml-1 text-yellow-500" />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStreakTooltip()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <Star className="h-4 w-4 text-yellow-500" />
        <span className="font-semibold">{stats.total_points}</span>
        <span className="text-xs text-muted-foreground">points</span>
      </Badge>
      
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <span className="font-semibold">Level {stats.level}</span>
      </Badge>

      {isFeatured && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="default" 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold">Featured</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your profile is featured until {new Date(stats.featured_until).toLocaleDateString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};