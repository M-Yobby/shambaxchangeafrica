import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, BookOpen, TrendingUp, Cloud, Droplets, Wind, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIChatbot from "@/components/AIChatbot";
import AddCropDialog from "@/components/AddCropDialog";
import AddLedgerDialog from "@/components/AddLedgerDialog";

interface Profile {
  full_name: string;
  location: string;
}

interface Crop {
  id: string;
  crop_name: string;
  planting_date: string;
  acreage: number;
  status: string;
}

interface LedgerSummary {
  totalIncome: number;
  totalExpenses: number;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary>({ totalIncome: 0, totalExpenses: 0 });
  const [addCropOpen, setAddCropOpen] = useState(false);
  const [addLedgerOpen, setAddLedgerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchCrops();
    fetchLedgerSummary();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setProfile(data);
        fetchWeather(data.location);
      }
    }
  };

  const fetchWeather = async (location: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("fetch-weather", {
        body: { location },
      });

      if (error) throw error;
      setWeather(data);
    } catch (error) {
      console.error("Weather fetch error:", error);
      toast({
        title: "Weather Unavailable",
        description: "Using default weather data",
        variant: "destructive",
      });
      setWeather({ temp: 24, humidity: 65, condition: "Partly Cloudy", windSpeed: 12 });
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchCrops = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("crops")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("planting_date", { ascending: false });
      
      if (data) setCrops(data);
    }
  };

  const fetchLedgerSummary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("ledger")
        .select("type, amount")
        .eq("user_id", user.id);
      
      if (data) {
        const summary = data.reduce(
          (acc, entry) => {
            if (entry.type === "income") {
              acc.totalIncome += Number(entry.amount);
            } else {
              acc.totalExpenses += Number(entry.amount);
            }
            return acc;
          },
          { totalIncome: 0, totalExpenses: 0 }
        );
        setLedgerSummary(summary);
      }
    }
  };

  const quickActions = [
    { icon: Plus, label: "Add Crop", color: "bg-primary", action: () => setAddCropOpen(true) },
    { icon: Calculator, label: "Add Expense/Income", color: "bg-secondary", action: () => setAddLedgerOpen(true) },
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
              {weatherLoading ? (
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              ) : (
                <>
                  <Cloud className="w-8 h-8 text-accent" />
                  <div>
                    <p className="font-semibold text-lg">{weather?.temp || 24}°C</p>
                    <p className="text-sm text-muted-foreground">{weather?.condition || "Partly Cloudy"}</p>
                  </div>
                  <div className="flex gap-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Droplets className="w-4 h-4" />
                      <span className="text-sm">{weather?.humidity || 65}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-4 h-4" />
                      <span className="text-sm">{Math.round(weather?.windSpeed || 12)}km/h</span>
                    </div>
                  </div>
                </>
              )}
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
            {crops.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="mb-4">No crops added yet</p>
                <Button onClick={() => setAddCropOpen(true)}>Add Your First Crop</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {crops.map((crop) => (
                  <div key={crop.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{crop.crop_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {crop.acreage} acres • Planted {new Date(crop.planting_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {crop.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setAddCropOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Another Crop
                </Button>
              </div>
            )}
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
                <span className="font-bold text-destructive">
                  KES {ledgerSummary.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Income</span>
                <span className="font-bold text-success">
                  KES {ledgerSummary.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium">Net Profit</span>
                <span className={`font-bold text-lg ${
                  ledgerSummary.totalIncome - ledgerSummary.totalExpenses >= 0 
                    ? "text-success" 
                    : "text-destructive"
                }`}>
                  KES {(ledgerSummary.totalIncome - ledgerSummary.totalExpenses).toLocaleString()}
                </span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setAddLedgerOpen(true)}>
                Add Entry
              </Button>
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

      <AddCropDialog 
        open={addCropOpen} 
        onOpenChange={setAddCropOpen}
        onSuccess={fetchCrops}
      />
      <AddLedgerDialog 
        open={addLedgerOpen} 
        onOpenChange={setAddLedgerOpen}
        onSuccess={fetchLedgerSummary}
      />
      <AIChatbot />
    </div>
  );
};

export default Dashboard;
