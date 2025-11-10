import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const MarketIntel = () => {
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
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>Personalized market insights for your farm</CardDescription>
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
    </div>
  );
};

export default MarketIntel;
