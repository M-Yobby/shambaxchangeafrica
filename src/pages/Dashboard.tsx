import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, BookOpen, TrendingUp, Cloud, Droplets, Wind, Loader2, Sparkles, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AIChatbot from "@/components/AIChatbot";
import AddCropDialog from "@/components/AddCropDialog";
import AddLedgerDialog from "@/components/AddLedgerDialog";
import YieldCalculatorDialog from "@/components/YieldCalculatorDialog";
import MyProduce from "@/components/MyProduce";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [yieldCalculatorOpen, setYieldCalculatorOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchCrops();
    fetchLedgerSummary();
    fetchAIInsights();
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ledger')
        .select('type, amount')
        .eq('user_id', user.id);

      if (error) throw error;

      const summary = data?.reduce(
        (acc, item) => {
          if (item.type === 'income') {
            acc.totalIncome += Number(item.amount);
          } else {
            acc.totalExpenses += Number(item.amount);
          }
          return acc;
        },
        { totalIncome: 0, totalExpenses: 0 }
      );

      setLedgerSummary(summary || { totalIncome: 0, totalExpenses: 0 });
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive",
      });
    }
  };

  const fetchAIInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights');

      if (error) {
        console.error('Error fetching AI insights:', error);
        setAiInsights([
          'Welcome to shambaXchange! Start by adding your crops.',
          'Track your income and expenses to understand farm profitability.',
          'Check the Learning Hub for farming tips and best practices.'
        ]);
        return;
      }

      setAiInsights(data.insights || []);
    } catch (error) {
      console.error('Error in fetchAIInsights:', error);
      setAiInsights([
        'Welcome to shambaXchange! Start by adding your crops.',
        'Track your income and expenses to understand farm profitability.',
        'Check the Learning Hub for farming tips and best practices.'
      ]);
    }
  };

  const quickActions = [
    { icon: Calculator, label: "Yield Calculator", color: "bg-primary", action: () => setYieldCalculatorOpen(true) },
    { icon: DollarSign, label: "Add Expense/Income", color: "bg-secondary", action: () => setAddLedgerOpen(true) },
    { icon: BookOpen, label: "Learning Hub", color: "bg-accent", action: () => navigate("/learning") },
    { icon: TrendingUp, label: "Market Prices", color: "bg-success", action: () => navigate("/market-intel") },
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

        <MyProduce onAddClick={() => setAddCropOpen(true)} />

        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
            <CardDescription>Personalized insights for your farm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
              <p className="font-medium mb-1">Best Planting Opportunity</p>
              <p className="text-sm text-muted-foreground">
                Tomatoes show strong demand in Nakuru with 12% price increase. Consider planting 
                if you have available land - harvest timing aligns with peak demand season.
              </p>
            </div>
            <div className="p-4 bg-secondary/10 rounded-lg border-l-4 border-secondary">
              <p className="font-medium mb-1">Selling Strategy</p>
              <p className="text-sm text-muted-foreground">
                Cabbage prices are rising. If you have ready stock, Nyeri market offers the 
                best rates (KES 82/kg avg) and high demand.
              </p>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg border-l-4 border-accent">
              <p className="font-medium mb-1">Price Alert</p>
              <p className="text-sm text-muted-foreground">
                Maize prices showing slight decline. Consider holding stock for 2-3 weeks 
                as seasonal patterns suggest recovery.
              </p>
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
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Visual breakdown of your farm finances</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={[
                  {
                    name: 'Expenses',
                    amount: ledgerSummary.totalExpenses,
                    fill: 'hsl(var(--destructive))'
                  },
                  {
                    name: 'Income',
                    amount: ledgerSummary.totalIncome,
                    fill: 'hsl(var(--success))'
                  },
                  {
                    name: 'Net Profit',
                    amount: ledgerSummary.totalIncome - ledgerSummary.totalExpenses,
                    fill: ledgerSummary.totalIncome - ledgerSummary.totalExpenses >= 0 
                      ? 'hsl(var(--success))' 
                      : 'hsl(var(--destructive))'
                  }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number) => `KES ${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="text-sm font-bold text-destructive">
                  KES {ledgerSummary.totalExpenses.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="text-sm font-bold text-success">
                  KES {ledgerSummary.totalIncome.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className={`text-sm font-bold ${
                  ledgerSummary.totalIncome - ledgerSummary.totalExpenses >= 0 
                    ? "text-success" 
                    : "text-destructive"
                }`}>
                  KES {(ledgerSummary.totalIncome - ledgerSummary.totalExpenses).toLocaleString()}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate("/finances")}
            >
              <Calculator className="w-4 h-4 mr-2" />
              View Detailed Breakdown
            </Button>
          </CardContent>
        </Card>
      </div>

      <YieldCalculatorDialog 
        open={yieldCalculatorOpen} 
        onOpenChange={setYieldCalculatorOpen}
      />
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
