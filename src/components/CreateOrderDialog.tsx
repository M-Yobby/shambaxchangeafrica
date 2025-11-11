import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { createNotification, NotificationTemplates } from "@/utils/notificationHelpers";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  sellerId: string;
  cropName: string;
  pricePerKg: number;
  availableQuantity: number;
  onOrderCreated?: () => void;
}

export const CreateOrderDialog = ({
  open,
  onOpenChange,
  listingId,
  sellerId,
  cropName,
  pricePerKg,
  availableQuantity,
  onOrderCreated,
}: CreateOrderDialogProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalAmount = quantity * pricePerKg;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0 || quantity > availableQuantity) {
      toast({
        title: "Invalid Quantity",
        description: `Please enter a quantity between 1 and ${availableQuantity}`,
        variant: "destructive",
      });
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a delivery address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: orderError } = await supabase.from("orders").insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
        quantity,
        amount: totalAmount,
        status: "requested",
        delivery_details: {
          address: deliveryAddress,
          notes: deliveryNotes,
        },
      });

      if (orderError) throw orderError;

      // Award points for creating order
      await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_points: 10,
        p_action: "creating an order",
      });

      // Create notification for seller
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const notification = NotificationTemplates.newOrder(
        buyerProfile?.full_name || 'Someone',
        cropName
      );
      
      await createNotification({
        userId: sellerId,
        ...notification,
        data: { listing_id: listingId },
      });

      toast({
        title: "Order Created",
        description: "Your order request has been sent to the seller",
      });

      onOpenChange(false);
      onOrderCreated?.();
      
      // Reset form
      setQuantity(1);
      setDeliveryAddress("");
      setDeliveryNotes("");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Create Order
          </DialogTitle>
          <DialogDescription>
            Request to buy {cropName} from this seller
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (kg)</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={availableQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="Enter quantity"
            />
            <p className="text-xs text-muted-foreground">
              Available: {availableQuantity}kg
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address</Label>
            <Input
              id="address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter delivery address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Delivery Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
            />
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Price per kg:</span>
              <span className="font-semibold">KES {pricePerKg}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span className="font-semibold">{quantity}kg</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">KES {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};