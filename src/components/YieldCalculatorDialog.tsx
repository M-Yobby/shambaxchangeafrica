import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";

const CROP_YIELD_DATA: Record<string, { avgYield: number; unit: string; growthPeriod: number }> = {
  maize: { avgYield: 2500, unit: "kg/acre", growthPeriod: 120 },
  beans: { avgYield: 800, unit: "kg/acre", growthPeriod: 90 },
  wheat: { avgYield: 1800, unit: "kg/acre", growthPeriod: 120 },
  rice: { avgYield: 3000, unit: "kg/acre", growthPeriod: 150 },
  potatoes: { avgYield: 12000, unit: "kg/acre", growthPeriod: 90 },
  tomatoes: { avgYield: 15000, unit: "kg/acre", growthPeriod: 75 },
  cabbage: { avgYield: 20000, unit: "kg/acre", growthPeriod: 70 },
  onions: { avgYield: 18000, unit: "kg/acre", growthPeriod: 100 },
};

interface YieldCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function YieldCalculatorDialog({ open, onOpenChange }: YieldCalculatorDialogProps) {
  const [selectedCrop, setSelectedCrop] = useState("");
  const [acreage, setAcreage] = useState("");
  const [expectedYield, setExpectedYield] = useState<number | null>(null);
  const [estimatedHarvest, setEstimatedHarvest] = useState<string>("");

  const calculateYield = () => {
    if (selectedCrop && acreage) {
      const cropData = CROP_YIELD_DATA[selectedCrop];
      if (cropData) {
        const yieldAmount = cropData.avgYield * Number(acreage);
        setExpectedYield(yieldAmount);
        
        // Calculate estimated harvest date
        const harvestDate = new Date();
        harvestDate.setDate(harvestDate.getDate() + cropData.growthPeriod);
        setEstimatedHarvest(harvestDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        }));
      }
    }
  };

  const handleReset = () => {
    setSelectedCrop("");
    setAcreage("");
    setExpectedYield(null);
    setEstimatedHarvest("");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Yield Calculator
          </DialogTitle>
          <DialogDescription>
            Estimate your potential harvest based on crop type and farm size
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="crop">Select Crop</Label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger id="crop">
                <SelectValue placeholder="Choose a crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maize">Maize (Corn)</SelectItem>
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

          <Button 
            onClick={calculateYield} 
            className="w-full"
            disabled={!selectedCrop || !acreage}
          >
            Calculate Expected Yield
          </Button>

          {expectedYield !== null && (
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                <p className="text-sm font-medium text-muted-foreground">Expected Yield</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {expectedYield.toLocaleString()} kg
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {CROP_YIELD_DATA[selectedCrop].avgYield.toLocaleString()} kg/acre average
                </p>
              </div>

              {estimatedHarvest && (
                <div className="p-4 bg-secondary/10 rounded-lg border-l-4 border-secondary">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Harvest Date</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {estimatedHarvest}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ~{CROP_YIELD_DATA[selectedCrop].growthPeriod} days from planting
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Calculate Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
