import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, Gift, Share2, CheckCircle, Clock, TrendingUp, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Referral {
  id: string;
  referred_id: string;
  status: string;
  created_at: string;
  referred_profile?: {
    full_name: string;
  };
}

interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  points_earned: number;
}

const Referrals = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    pending: 0,
    completed: 0,
    points_earned: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's referral code
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (referralsError) throw referralsError;

      // Fetch referred user profiles
      const referredIds = referralsData?.map(r => r.referred_id) || [];
      if (referredIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", referredIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedReferrals = referralsData?.map(ref => ({
          ...ref,
          referred_profile: profilesMap.get(ref.referred_id),
        })) || [];

        setReferrals(enrichedReferrals);

        // Calculate stats
        const completed = enrichedReferrals.filter(r => r.status === 'completed').length;
        const pending = enrichedReferrals.filter(r => r.status === 'pending').length;

        setStats({
          total: enrichedReferrals.length,
          completed,
          pending,
          points_earned: completed * 100, // 100 points per completed referral
        });
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Share this link with other farmers to earn rewards",
    });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Code Copied!",
      description: "Share your referral code with other farmers",
    });
  };

  const shareViaWhatsApp = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    const message = `Join me on shambaXchange - the farming community platform! Use my code ${referralCode} when signing up: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getRewardTier = () => {
    const completed = stats.completed;
    if (completed >= 10) return { tier: "Gold", next: null, progress: 100 };
    if (completed >= 5) return { tier: "Silver", next: 10, progress: (completed / 10) * 100 };
    if (completed >= 3) return { tier: "Bronze", next: 5, progress: (completed / 5) * 100 };
    return { tier: "Starter", next: 3, progress: (completed / 3) * 100 };
  };

  const rewardTier = getRewardTier();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">
          Grow your farming circle and earn rewards
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Completed signups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Gift className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.points_earned}</div>
            <p className="text-xs text-muted-foreground">
              From referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Tier</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{rewardTier.tier}</div>
            {rewardTier.next && (
              <p className="text-xs text-muted-foreground">
                {rewardTier.next - stats.completed} more to {rewardTier.next === 5 ? 'Silver' : 'Gold'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share your code or link to invite farmers to shambaXchange
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Code</label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg tracking-wider"
              />
              <Button onClick={copyReferralCode} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Link</label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/auth?ref=${referralCode}`}
                readOnly
                className="text-sm"
              />
              <Button onClick={copyReferralLink} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={shareViaWhatsApp} className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            Share via WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Rewards Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Reward Tiers</CardTitle>
          <CardDescription>Unlock rewards as you refer more farmers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { tier: "Bronze", referrals: 3, reward: "100 bonus points + Recruiter badge" },
              { tier: "Silver", referrals: 5, reward: "250 bonus points + priority support" },
              { tier: "Gold", referrals: 10, reward: "500 bonus points + Community Builder badge + premium features" },
            ].map((level) => (
              <div
                key={level.tier}
                className={`p-4 rounded-lg border ${
                  stats.completed >= level.referrals
                    ? "bg-primary/5 border-primary"
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {level.tier} Tier
                      {stats.completed >= level.referrals && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {level.referrals} referrals
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{level.reward}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {referrals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No referrals yet. Start sharing your code!</p>
              </CardContent>
            </Card>
          ) : (
            referrals.map((referral) => (
              <Card key={referral.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {referral.referred_profile?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {referral.referred_profile?.full_name || "Pending User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={referral.status === "completed" ? "default" : "secondary"}
                  >
                    {referral.status === "completed" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {referral.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {referrals.filter(r => r.status === 'completed').map((referral) => (
            <Card key={referral.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {referral.referred_profile?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {referral.referred_profile?.full_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">+100 points</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {referrals.filter(r => r.status === 'pending').map((referral) => (
            <Card key={referral.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-muted">
                      <Users className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">New Signup</p>
                    <p className="text-xs text-muted-foreground">
                      Signed up {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Waiting for first activity
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Referrals;