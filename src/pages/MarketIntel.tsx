import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subMonths } from "date-fns";

const MarketIntel = () => {
  const [selectedCrop, setSelectedCrop] = useState("Tomatoes");
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cropOptions = ["Tomatoes", "Cabbages", "Maize", "Beans", "Potatoes", "Onions", "Carrots"];

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setLoading(true);
      try {
        const sixMonthsAgo = subMonths(new Date(), 6);
        
        const { data, error } = await supabase
          .from("market_prices")
          .select("price_per_kg, recorded_at, region")
          .eq("crop_name", selectedCrop)
          .gte("recorded_at", sixMonthsAgo.toISOString())
          .order("recorded_at", { ascending: true });

        if (error) throw error;

        // Group by date and calculate average price across regions
        const priceMap = new Map<string, { total: number; count: number }>();
        
        data?.forEach((record) => {
          const date = format(new Date(record.recorded_at), "MMM dd");
          const existing = priceMap.get(date) || { total: 0, count: 0 };
          priceMap.set(date, {
            total: existing.total + Number(record.price_per_kg),
            count: existing.count + 1,
          });
        });

        const chartData = Array.from(priceMap.entries()).map(([date, { total, count }]) => ({
          date,
          price: Math.round(total / count),
        }));

        setPriceHistory(chartData);
      } catch (error) {
        console.error("Error fetching price history:", error);
        setPriceHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [selectedCrop]);

  const topCrops = [
    { name: "Tomatoes", price: 85, change: 12, trend: "up" },
    { name: "Cabbages", price: 45, change: 8, trend: "up" },
    { name: "Maize", price: 52, change: -3, trend: "down" },
    { name: "Beans", price: 120, change: 5, trend: "up" },
    { name: "Potatoes", price: 38, change: -2, trend: "down" },
  ];

  const regions = [
    { name: "Nakuru", demand: "High", avgPrice: 75 },
    { name: "Kisii", demand: "Medium", avgPrice: 68 },
    { name: "Nyeri", demand: "High", avgPrice: 82 },
    { name: "Eldoret", demand: "Medium", avgPrice: 71 },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Market Intelligence</h1>
        <p className="text-muted-foreground">AI-powered insights on crop prices and demand</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Top Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success/20 rounded-full">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-lg">Tomatoes</p>
                <p className="text-sm text-muted-foreground">+12% this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Market Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/20 rounded-full">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-lg">Very High</p>
                <p className="text-sm text-muted-foreground">215 active trades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Avg. Price Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-full">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">KES 72</p>
                <p className="text-sm text-muted-foreground">Per kg average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Price Trends</CardTitle>
            <CardDescription>Top 5 crops by demand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCrops.map((crop) => (
                <div key={crop.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {crop.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{crop.name}</p>
                      <p className="text-sm text-muted-foreground">KES {crop.price}/kg</p>
                    </div>
                  </div>
                  <Badge variant={crop.trend === "up" ? "default" : "destructive"}>
                    {crop.change > 0 ? "+" : ""}{crop.change}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Demand</CardTitle>
            <CardDescription>Market activity by region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regions.map((region) => (
                <div key={region.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{region.name}</p>
                    <p className="text-sm text-muted-foreground">Avg: KES {region.avgPrice}/kg</p>
                  </div>
                  <Badge variant={region.demand === "High" ? "default" : "secondary"}>
                    {region.demand} Demand
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Price Trends - Last 6 Months</CardTitle>
              <CardDescription>Historical price data to guide planting decisions</CardDescription>
            </div>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select crop" />
              </SelectTrigger>
              <SelectContent>
                {cropOptions.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading price data...</p>
            </div>
          ) : priceHistory.length > 0 ? (
            <ChartContainer
              config={{
                price: {
                  label: "Price (KES/kg)",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: "KES/kg", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">
                No historical price data available for {selectedCrop}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default MarketIntel;
