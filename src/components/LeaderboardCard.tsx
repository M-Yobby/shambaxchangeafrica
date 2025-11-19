/**
 * LEADERBOARD CARD
 * 
 * Displays ranked list of farmers with icons for top 3 positions.
 * Supports different metrics (sales, points, engagement) with custom formatting.
 * 
 * @component
 * @example
 * ```tsx
 * <LeaderboardCard
 *   entries={topSellers}
 *   title="Top Sellers"
 *   description="Farmers with highest sales"
 *   metric="total_sales"
 *   formatValue={(val) => `KES ${val.toLocaleString()}`}
 *   icon={<DollarSign />}
 * />
 * ```
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

/**
 * Single leaderboard entry data structure
 * @interface LeaderboardEntry
 */
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  location: string;
  total_sales: number;
  points: number;
  level: number;
  streak_days: number;
  total_likes_received: number;
  total_comments: number;
  completed_orders: number;
  avg_rating: number;
}

/**
 * Props for the LeaderboardCard component
 * @interface LeaderboardCardProps
 * @property {LeaderboardEntry[]} entries - Array of leaderboard entries to display
 * @property {string} title - Card title
 * @property {string} description - Card description
 * @property {keyof LeaderboardEntry} metric - Which metric to display as the main value
 * @property {(value: any, entry?: LeaderboardEntry) => string} [formatValue] - Custom formatter for metric value
 * @property {React.ReactNode} [icon] - Optional icon to display in header
 */
interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  title: string;
  description: string;
  metric: keyof LeaderboardEntry;
  formatValue?: (value: any, entry?: LeaderboardEntry) => string;
  icon?: React.ReactNode;
}

export const LeaderboardCard = ({
  entries, 
  title, 
  description, 
  metric,
  formatValue = (v) => v.toString(),
  icon
}: LeaderboardCardProps) => {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-semibold">#{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon || <TrendingUp className="h-5 w-5" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No data yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index < 3 ? 'bg-primary/5 border border-primary/10' : 'bg-muted/30'
                }`}
              >
                <div className="flex-shrink-0 w-8 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {entry.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{entry.full_name}</p>
                    {getRankBadge(index) && <span>{getRankBadge(index)}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.location}</span>
                    <Badge variant="outline" className="text-xs">
                      Level {entry.level}
                    </Badge>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatValue(entry[metric], entry)}
                  </p>
                  {metric === 'total_sales' && entry.avg_rating > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ⭐ {entry.avg_rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};