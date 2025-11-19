import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sprout } from "lucide-react";

interface Crop {
  id: string;
  crop_name: string;
  planting_date: string;
  acreage: number;
  expected_yield: number | null;
  status: string;
  created_at: string;
}

interface MyProduceProps {
  onAddClick: () => void;
}

export default function MyProduce({ onAddClick }: MyProduceProps) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("crops")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("planting_date", { ascending: false });
        
        if (error) throw error;
        if (data) setCrops(data);
      }
    } catch (error) {
      console.error("Error fetching crops:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysPlanted = (plantingDate: string) => {
    const planted = new Date(plantingDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - planted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            My Produce
          </CardTitle>
          <CardDescription>Track your crops and harvests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading your produce...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sprout className="w-5 h-5" />
          My Produce
        </CardTitle>
        <CardDescription>Track your crops and harvests</CardDescription>
      </CardHeader>
      <CardContent>
        {crops.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sprout className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="mb-4">No produce added yet</p>
            <Button onClick={onAddClick}>Add Your First Crop</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {crops.map((crop) => (
              <div key={crop.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-lg">{crop.crop_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {crop.acreage} acres
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                    {crop.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Planted</p>
                    <p className="font-medium">
                      {new Date(crop.planting_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getDaysPlanted(crop.planting_date)} days ago
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Expected Yield</p>
                    <p className="font-medium">
                      {crop.expected_yield 
                        ? `${crop.expected_yield.toLocaleString()} kg`
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onAddClick}
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Add More Produce
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
