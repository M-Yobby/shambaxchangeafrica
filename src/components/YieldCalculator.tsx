import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

const CROP_YIELD_DATA: Record<string, { avgYield: number; unit: string }> = {
  maize: { avgYield: 2500, unit: "kg/acre" },
  beans: { avgYield: 800, unit: "kg/acre" },
  wheat: { avgYield: 1800, unit: "kg/acre" },
  rice: { avgYield: 3000, unit: "kg/acre" },
  potatoes: { avgYield: 12000, unit: "kg/acre" },
  tomatoes: { avgYield: 15000, unit: "kg/acre" },
  cabbage: { avgYield: 20000, unit: "kg/acre" },
  onions: { avgYield: 18000, unit: "kg/acre" },
};

export default function YieldCalculator() {
  const [selectedCrop, setSelectedCrop] = useState("");
  const [acreage, setAcreage] = useState("");
  const [expectedYield, setExpectedYield] = useState<number | null>(null);

  const calculateYield = () => {
    if (selectedCrop && acreage) {
      const cropData = CROP_YIELD_DATA[selectedCrop];
      if (cropData) {
        const yield_amount = cropData.avgYield * Number(acreage);
        setExpectedYield(yield_amount);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Yield Calculator
        </CardTitle>
        <CardDescription>Estimate your potential harvest</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="crop">Select Crop</Label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger id="crop">
                <SelectValue placeholder="Choose a crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maize">Maize</SelectItem>
                <SelectItem value="beans">Beans</SelectItem>
                <SelectItem value="wheat">Wheat</SelectItem>
                <SelectItem value="rice">Rice</SelectItem>
                <SelectItem value="potatoes">Potatoes</SelectItem>
                <SelectItem value="tomatoes">Tomatoes</SelectItem>
                <SelectItem value="cabbage">Cabbage</SelectItem>
                <SelectItem value="onions">Onions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acreage">Farm Size (acres)</Label>
            <Input
              id="acreage"
              type="number"
              placeholder="Enter acreage"
              value={acreage}
              onChange={(e) => setAcreage(e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>
        </div>

        <Button 
          onClick={calculateYield} 
          className="w-full"
          disabled={!selectedCrop || !acreage}
        >
          Calculate Expected Yield
        </Button>

        {expectedYield !== null && (
          <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
            <p className="text-sm font-medium text-foreground">Expected Yield</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {expectedYield.toLocaleString()} kg
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on average {selectedCrop} yields in East Africa
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
