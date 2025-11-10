import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { RefreshCw, TrendingUp, DollarSign, Users, Flame, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  location: string;
  total_sales: number;
  completed_orders: number;
  avg_rating: number;
  total_reviews: number;
  points: number;
  level: number;
  streak_days: number;
  total_posts: number;
  total_likes_received: number;
  total_likes_given: number;
  total_comments: number;
}

const Leaderboards = () => {
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [regions, setRegions] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboards();
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location')
        .not('location', 'is', null);

      if (error) throw error;

      const uniqueRegions = [...new Set(data.map(p => p.location))].filter(Boolean);
      setRegions(uniqueRegions);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      
      // Query the materialized view
      let query = supabase
        .from('leaderboards')
        .select('*');

      if (selectedRegion !== "all") {
        query = query.eq('location', selectedRegion);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLeaderboards(data || []);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaderboards = async () => {
    try {
      toast({
        title: "Refreshing...",
        description: "Updating leaderboard data",
      });

      const { error } = await supabase.functions.invoke('refresh-leaderboard');

      if (error) throw error;

      await fetchLeaderboards();

      toast({
        title: "Success",
        description: "Leaderboards refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing leaderboards:', error);
      toast({
        title: "Error",
        description: "Failed to refresh leaderboards",
        variant: "destructive",
      });
    }
  };

  const getTopSellers = () => {
    return [...leaderboards]
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 10);
  };

  const getTopByPoints = () => {
    return [...leaderboards]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  };

  const getTopBySocialEngagement = () => {
    return [...leaderboards]
      .sort((a, b) => {
        const engagementA = a.total_likes_received + a.total_comments;
        const engagementB = b.total_likes_received + b.total_comments;
        return engagementB - engagementA;
      })
      .slice(0, 10);
  };

  const getTopStreaks = () => {
    return [...leaderboards]
      .sort((a, b) => b.streak_days - a.streak_days)
      .slice(0, 10);
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedRegion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leaderboards</h1>
          <p className="text-muted-foreground">Top performing farmers in the community</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={refreshLeaderboards} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="sales" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Points
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Users className="h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="streaks" className="gap-2">
            <Flame className="h-4 w-4" />
            Streaks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <LeaderboardCard
            entries={getTopSellers()}
            title="Top Sellers"
            description="Farmers with the highest total sales"
            metric="total_sales"
            formatValue={(v) => `KES ${v.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
          />
        </TabsContent>

        <TabsContent value="points">
          <LeaderboardCard
            entries={getTopByPoints()}
            title="Top by Points"
            description="Most engaged farmers by total points earned"
            metric="points"
            formatValue={(v) => `${v.toLocaleString()} pts`}
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          />
        </TabsContent>

        <TabsContent value="social">
          <LeaderboardCard
            entries={getTopBySocialEngagement()}
            title="Social Leaders"
            description="Most active in the community"
            metric="total_likes_received"
            formatValue={(v, entry) => 
              entry ? `${v + entry.total_comments} interactions` : `${v} likes`
            }
            icon={<Users className="h-5 w-5 text-purple-600" />}
          />
        </TabsContent>

        <TabsContent value="streaks">
          <LeaderboardCard
            entries={getTopStreaks()}
            title="Longest Streaks"
            description="Farmers with the most consecutive days"
            metric="points"
            formatValue={(v, entry) => entry ? `${entry.streak_days} days` : `${v} days`}
            icon={<Flame className="h-5 w-5 text-orange-600" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboards;