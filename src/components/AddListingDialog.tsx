/**
 * ADD LISTING DIALOG
 * 
 * Form for sellers to create new marketplace listings of their produce.
 * This is the entry point for adding inventory to the marketplace.
 * 
 * LISTING CREATION FLOW:
 * 1. Seller clicks "List Your Produce" button in Marketplace
 * 2. Dialog opens with form fields
 * 3. Seller fills: crop name, quantity (kg), price per kg, location
 * 4. On submit → creates record in marketplace_listings table
 * 5. Listing appears in marketplace with status "active"
 * 6. Buyers can now see and purchase the listing
 * 
 * KEY FEATURES:
 * - Dynamic crop dropdown (populated from popular crops used by 5+ farmers)
 * - Form validation (all fields required)
 * - Loading state during submission
 * - Success toast notification
 * - Auto-refresh marketplace after successful creation
 * 
 * DATABASE INTEGRATION:
 * - Inserts into: marketplace_listings table
 * - Columns set: seller_id (auth user), crop_name, quantity, price_per_kg, location, status
 * - RLS Policy: Users can only create listings for themselves (seller_id = auth.uid())
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePopularCrops } from "@/hooks/usePopularCrops";
import { Loader2 } from "lucide-react";

interface AddListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback to refresh marketplace listings
}

const AddListingDialog = ({ open, onOpenChange, onSuccess }: AddListingDialogProps) => {
  // CROP OPTIONS - Dynamically populated from get_popular_crops() database function
  // Only shows crops that 5+ farmers have added to dashboard or marketplace
  const { crops: cropOptions } = usePopularCrops();
  
  // FORM STATE
  const [loading, setLoading] = useState(false); // Submission in progress
  const [cropName, setCropName] = useState(""); // Selected crop from dropdown
  const [quantity, setQuantity] = useState(""); // Amount available in kg
  const [pricePerKg, setPricePerKg] = useState(""); // Price per kilogram in KES
  const [location, setLocation] = useState(""); // Seller's location
  
  const { toast } = useToast();

  /**
   * HANDLE SUBMIT
   * Creates new marketplace listing in database
   * 
   * VALIDATION:
   * - All fields must be filled (crop, quantity, price, location)
   * - User must be authenticated
   * 
   * PROCESS:
   * 1. Validate form completeness
   * 2. Get authenticated user ID
   * 3. Insert listing into marketplace_listings table with status "active"
   * 4. Show success toast
   * 5. Reset form fields
   * 6. Close dialog
   * 7. Trigger parent refresh to show new listing
   * 
   * DATABASE OPERATION:
   * INSERT INTO marketplace_listings (
   *   seller_id,      -- Current authenticated user
   *   crop_name,      -- Selected from popular crops
   *   quantity,       -- Amount in kg
   *   price_per_kg,   -- Price in KES
   *   location,       -- Seller's location
   *   status          -- Set to "active" for immediate visibility
   * )
   * 
   * RLS SECURITY:
   * Policy ensures seller_id = auth.uid() preventing users from
   * creating listings on behalf of others
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION: Ensure all required fields are filled
    if (!cropName || !quantity || !pricePerKg || !location) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Get authenticated user (required for seller_id)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Step 2: Insert listing into database
      const { error } = await supabase.from("marketplace_listings").insert({
        seller_id: user.id, // RLS policy validates this matches auth.uid()
        crop_name: cropName,
        quantity: parseFloat(quantity), // Convert string to number
        price_per_kg: parseFloat(pricePerKg), // Convert string to number
        location,
        status: "active", // Immediately visible in marketplace
      });

      if (error) throw error;

      // Step 3: Notify user of success
      toast({
        title: "Success!",
        description: "Your listing has been created",
      });

      // Step 4: Reset form for next use
      setCropName("");
      setQuantity("");
      setPricePerKg("");
      setLocation("");
      
      // Step 5: Close dialog and refresh parent
      onOpenChange(false);
      onSuccess(); // Triggers fetchListings() in parent component
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>List Your Produce</DialogTitle>
          <DialogDescription>Add your produce to the marketplace</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cropName">Crop Name</Label>
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
            <Label htmlFor="quantity">Quantity (kg)</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price per KG (KES)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              placeholder="e.g., 85"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kisii"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddListingDialog;
