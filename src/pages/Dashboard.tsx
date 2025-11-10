import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, BookOpen, TrendingUp, Cloud, Droplets, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string;
  location: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weather, setWeather] = useState({ temp: 24, humidity: 65, condition: "Partly Cloudy" });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (data) setProfile(data);
    }
  };

  const quickActions = [
    { icon: Plus, label: "Add Crop", color: "bg-primary", action: () => toast({ title: "Coming soon", description: "Add crop feature" }) },
    { icon: Calculator, label: "Yield Calculator", color: "bg-secondary", action: () => toast({ title: "Coming soon", description: "Yield calculator" }) },
    { icon: BookOpen, label: "Learning Hub", color: "bg-accent", action: () => toast({ title: "Coming soon", description: "Learning hub" }) },
    { icon: TrendingUp, label: "Market Prices", color: "bg-success", action: () => toast({ title: "Coming soon", description: "Market prices" }) },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Hi, {profile?.full_name || "Farmer"} 👋
            </h1>
            <p className="text-muted-foreground">{profile?.location || "Kenya"}</p>
          </div>
          
          <Card className="w-full sm:w-auto">
            <CardContent className="p-4 flex items-center gap-4">
              <Cloud className="w-8 h-8 text-accent" />
              <div>
                <p className="font-semibold text-lg">{weather.temp}°C</p>
                <p className="text-sm text-muted-foreground">{weather.condition}</p>
              </div>
              <div className="flex gap-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Droplets className="w-4 h-4" />
                  <span className="text-sm">{weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="w-4 h-4" />
                  <span className="text-sm">12km/h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="h-auto flex-col gap-2 p-6 hover:shadow-md transition-shadow"
              onClick={action.action}
            >
              <div className={`${action.color} p-3 rounded-full`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Personalized recommendations for your farm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
              <p className="text-sm font-medium">🌱 Planting Recommendation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Rain expected this week - ideal time to plant maize in your region
              </p>
            </div>
            <div className="p-4 bg-secondary/10 rounded-lg border-l-4 border-secondary">
              <p className="text-sm font-medium">💰 Market Opportunity</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cabbage prices rising 15% in Nakuru - consider selling soon
              </p>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg border-l-4 border-accent">
              <p className="text-sm font-medium">⚠️ Weather Alert</p>
              <p className="text-sm text-muted-foreground mt-1">
                Heavy rains forecasted next week - prepare drainage systems
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Crops</CardTitle>
            <CardDescription>Active crops on your farm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="mb-4">No crops added yet</p>
              <Button>Add Your First Crop</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Track your farm expenses and income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Expenses</span>
                <span className="font-bold text-destructive">KES 0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Income</span>
                <span className="font-bold text-success">KES 0</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium">Net Profit</span>
                <span className="font-bold text-lg">KES 0</span>
              </div>
              <Button variant="outline" className="w-full">View Ledger</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Resources</CardTitle>
            <CardDescription>Recommended for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <p className="text-sm font-medium">Climate-Smart Farming Basics</p>
              <p className="text-xs text-muted-foreground mt-1">15 min read</p>
            </div>
            <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <p className="text-sm font-medium">Maximizing Maize Yields</p>
              <p className="text-xs text-muted-foreground mt-1">Video • 8 min</p>
            </div>
            <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <p className="text-sm font-medium">Market Timing Strategies</p>
              <p className="text-xs text-muted-foreground mt-1">12 min read</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
