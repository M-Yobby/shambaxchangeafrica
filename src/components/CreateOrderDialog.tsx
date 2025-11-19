/**
 * CREATE ORDER DIALOG
 * 
 * Form for buyers to request purchase from a marketplace listing.
 * This initiates the order/transaction flow between buyer and seller.
 * 
 * ORDER CREATION FLOW:
 * 1. Buyer browses marketplace and clicks "Buy Now" on a listing
 * 2. Dialog opens pre-populated with listing details (crop, price, available quantity)
 * 3. Buyer specifies: quantity to purchase, delivery address, optional notes
 * 4. On submit → creates order record with status "requested"
 * 5. Seller receives notification of new order request
 * 6. Buyer earns 10 points for creating order
 * 7. Order appears in buyer's "My Purchases" tab
 * 8. Seller sees order in their "My Sales" tab
 * 
 * ORDER STATUS LIFECYCLE:
 * - requested: Initial state, awaiting seller action
 * - confirmed: Seller accepts, preparing shipment
 * - in-transit: Shipped, on the way
 * - delivered: Received by buyer
 * - completed: Transaction finished with review
 * - cancelled: Order cancelled (either party)
 * 
 * VALIDATION:
 * - Quantity must be between 1 and available quantity
 * - Delivery address required
 * 
 * DATABASE INTEGRATION:
 * - Inserts into: orders table
 * - Creates notification for seller
 * - Awards points to buyer via award_points() function
 */

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
  listingId: string; // Marketplace listing being purchased
  sellerId: string; // Seller user ID for order linkage
  cropName: string; // Display crop name in dialog
  pricePerKg: number; // Price per kg for total calculation
  availableQuantity: number; // Max quantity buyer can request
  onOrderCreated?: () => void; // Callback to refresh orders list
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
  // FORM STATE
  const [quantity, setQuantity] = useState<number>(1); // Amount to purchase (kg)
  const [deliveryAddress, setDeliveryAddress] = useState(""); // Where to ship
  const [deliveryNotes, setDeliveryNotes] = useState(""); // Optional delivery instructions
  const [loading, setLoading] = useState(false); // Submission in progress
  const { toast } = useToast();

  // CALCULATED TOTAL - Updates reactively as quantity changes
  const totalAmount = quantity * pricePerKg;

  /**
   * HANDLE SUBMIT
   * Creates order record and notifies seller
   * 
   * VALIDATION:
   * - Quantity must be > 0 and <= available quantity
   * - Delivery address required (notes optional)
   * - User must be authenticated
   * 
   * PROCESS:
   * 1. Validate quantity and delivery address
   * 2. Get authenticated user (buyer)
   * 3. Insert order into orders table with status "requested"
   * 4. Award 10 points to buyer for creating order
   * 5. Fetch buyer's name for notification
   * 6. Create notification for seller about new order request
   * 7. Show success toast to buyer
   * 8. Close dialog and trigger order list refresh
   * 9. Reset form for next use
   * 
   * DATABASE OPERATIONS:
   * 
   * 1. INSERT INTO orders:
   *    - listing_id: Links to marketplace listing
   *    - buyer_id: Current authenticated user
   *    - seller_id: From listing (seller receiving order)
   *    - quantity: Amount buyer wants to purchase
   *    - amount: Total cost (quantity * price_per_kg)
   *    - status: "requested" (initial state)
   *    - delivery_details: JSONB with address and notes
   * 
   * 2. CALL award_points():
   *    - Awards 10 points to buyer for creating order
   *    - Contributes to level progression
   * 
   * 3. INSERT INTO notifications:
   *    - Alerts seller about new order request
   *    - Includes buyer name and crop name
   *    - Links to listing for context
   * 
   * RLS SECURITY:
   * - Order RLS policy ensures buyer_id = auth.uid()
   * - Prevents creating orders on behalf of others
   * - Both buyer and seller can view the order (bilateral access)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATION 1: Check quantity is within valid range
    if (quantity <= 0 || quantity > availableQuantity) {
      toast({
        title: "Invalid Quantity",
        description: `Please enter a quantity between 1 and ${availableQuantity}`,
        variant: "destructive",
      });
      return;
    }

    // VALIDATION 2: Delivery address required for shipping
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
      
      // Step 1: Get authenticated buyer
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Step 2: Create order record with "requested" status
      const { error: orderError } = await supabase.from("orders").insert({
        listing_id: listingId, // Link to marketplace listing
        buyer_id: user.id, // Current user is buyer
        seller_id: sellerId, // From listing, user receiving order request
        quantity, // Amount buyer wants
        amount: totalAmount, // Total cost calculated above
        status: "requested", // Initial status, awaiting seller confirmation
        delivery_details: {
          address: deliveryAddress, // Where to ship
          notes: deliveryNotes, // Optional instructions
        },
      });

      if (orderError) throw orderError;

      // Step 3: Award points to buyer for creating order
      // Encourages marketplace activity and engagement
      await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_points: 10,
        p_action: "creating an order",
      });

      // Step 4: Fetch buyer's name for notification personalization
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Step 5: Notify seller about new order request
      // Seller can then confirm/reject in their "My Sales" tab
      const notification = NotificationTemplates.newOrder(
        buyerProfile?.full_name || 'Someone',
        cropName
      );
      
      await createNotification({
        userId: sellerId,
        ...notification,
        data: { listing_id: listingId }, // Context for notification
      });

      // Step 6: Show success message to buyer
      toast({
        title: "Order Created",
        description: "Your order request has been sent to the seller",
      });

      // Step 7: Close dialog and refresh
      onOpenChange(false);
      onOrderCreated?.(); // Triggers fetchOrders() in parent
      
      // Step 8: Reset form for potential next order
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