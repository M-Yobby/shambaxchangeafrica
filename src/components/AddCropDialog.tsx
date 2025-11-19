import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompleteReferral } from "@/hooks/useCompleteReferral";
import { usePopularCrops } from "@/hooks/usePopularCrops";
import { Loader2 } from "lucide-react";

interface AddCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddCropDialog = ({ open, onOpenChange, onSuccess }: AddCropDialogProps) => {
  const { crops: cropOptions } = usePopularCrops();
  const [cropName, setCropName] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [acreage, setAcreage] = useState("");
  const [expectedYield, setExpectedYield] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { completeReferral } = useCompleteReferral();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("crops").insert({
        user_id: user.id,
        crop_name: cropName,
        planting_date: plantingDate,
        acreage: parseFloat(acreage),
        expected_yield: expectedYield ? parseFloat(expectedYield) : null,
        status: "active",
      });

      if (error) throw error;

      // Award points for adding crop
      await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_points: 10,
        p_action: "adding a crop",
      });

      // Complete referral if this is first activity
      await completeReferral();

      toast({
        title: "Success",
        description: "Crop added successfully!",
      });

      setCropName("");
      setPlantingDate("");
      setAcreage("");
      setExpectedYield("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding crop:", error);
      toast({
        title: "Error",
        description: "Failed to add crop. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Crop</DialogTitle>
          <DialogDescription>
            Enter details about your crop to track its progress
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cropName">Crop Name *</Label>
            <Select value={cropName} onValueChange={setCropName} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a crop" />
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
          <div className="space-y-2">
            <Label htmlFor="plantingDate">Planting Date *</Label>
            <Input
              id="plantingDate"
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acreage">Acreage *</Label>
            <Input
              id="acreage"
              type="number"
              step="0.1"
              value={acreage}
              onChange={(e) => setAcreage(e.target.value)}
              placeholder="e.g., 2.5"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedYield">Expected Yield (kg)</Label>
            <Input
              id="expectedYield"
              type="number"
              step="0.1"
              value={expectedYield}
              onChange={(e) => setExpectedYield(e.target.value)}
              placeholder="e.g., 500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Crop
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCropDialog;
