/**
 * ORDER CARD
 * 
 * Displays order details with status-based actions for managing transactions.
 * Different UI and actions shown based on user role (buyer vs seller) and order status.
 * 
 * ORDER STATUS FLOW:
 * 
 * BUYER PERSPECTIVE:
 * 1. requested → Waiting for seller to confirm
 * 2. confirmed → Seller preparing order, waiting for shipment
 * 3. in-transit → Order shipped, tracking delivery
 * 4. delivered → Mark as received → completed
 * 5. completed → Leave review (ReviewDialog)
 * 
 * SELLER PERSPECTIVE:
 * 1. requested → Confirm order OR Cancel
 * 2. confirmed → Mark as shipped (in-transit)
 * 3. in-transit → Waiting for buyer to receive
 * 4. delivered → Waiting for buyer to complete
 * 5. completed → Transaction finished
 * 
 * STATUS ACTIONS BY ROLE:
 * 
 * Seller Actions:
 * - requested: "Confirm Order" (→ confirmed) or "Cancel Order" (→ cancelled)
 * - confirmed: "Mark as Shipped" (→ in-transit)
 * - in-transit/delivered/completed: No actions (buyer-driven)
 * 
 * Buyer Actions:
 * - requested/confirmed/in-transit: "Cancel Order" (→ cancelled)
 * - delivered: "Mark as Received" (→ completed)
 * - completed: "Leave Review" (opens ReviewDialog)
 * 
 * KEY FEATURES:
 * - Status-based color coding and icons
 * - Role-specific action buttons
 * - Real-time status updates (visible to both parties)
 * - Direct messaging button (opens MessagingDialog)
 * - Points awarded on completion (50 for seller, 25 for buyer)
 * - Review system for completed orders
 * 
 * DATABASE OPERATIONS:
 * - Updates: order status via PATCH
 * - Inserts: notifications for status changes
 * - Calls: award_points() on completion
 * - Inserts: reviews via ReviewDialog
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ReviewDialog } from "./ReviewDialog";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  MessageSquare,
  MapPin,
} from "lucide-react";

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  quantity: number;
  amount: number;
  status: string;
  delivery_details: any;
  created_at: string;
  listing?: {
    crop_name: string;
    price_per_kg: number;
  };
  buyer_profile?: {
    full_name: string;
  };
  seller_profile?: {
    full_name: string;
  };
}

interface OrderCardProps {
  order: Order;
  userRole: "buyer" | "seller"; // Determines which actions to show
  onStatusChange?: () => void; // Callback to refresh order list
  onMessageClick?: () => void; // Opens messaging dialog
}

export const OrderCard = ({
  order,
  userRole,
  onStatusChange,
  onMessageClick,
}: OrderCardProps) => {
  const [loading, setLoading] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "requested":
        return <Package className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-transit":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in-transit":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-300";
      case "completed":
        return "bg-primary/10 text-primary border-primary/30";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  /**
   * UPDATE ORDER STATUS
   * Changes order status and notifies the other party
   * 
   * PROCESS:
   * 1. Update order status in database
   * 2. Create notification for other party (buyer or seller)
   * 3. If status is "completed", award points to both parties:
   *    - Seller: 50 points for completing sale
   *    - Buyer: 25 points for completing purchase
   * 4. Show success toast
   * 5. Trigger parent refresh to update order list
   * 
   * COMMON STATUS TRANSITIONS:
   * - requested → confirmed (seller confirms)
   * - confirmed → in-transit (seller ships)
   * - delivered → completed (buyer receives)
   * - any → cancelled (either party cancels)
   * 
   * NOTIFICATIONS:
   * - Sent to the opposite party in transaction
   * - Includes order context for quick reference
   * - Enables real-time order tracking for both users
   * 
   * POINTS SYSTEM:
   * - Only awarded on "completed" status
   * - Seller gets 50 points (larger reward for successful sale)
   * - Buyer gets 25 points (reward for marketplace participation)
   * - Encourages transaction completion and platform engagement
   */
  const updateOrderStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      
      // Step 1: Update order status in database
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      // Step 2: Notify the other party about status change
      // Buyer notifications go to seller, seller notifications go to buyer
      const recipientId = userRole === "seller" ? order.buyer_id : order.seller_id;
      await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "order",
        title: "Order Status Updated",
        message: `Order status changed to ${newStatus}`,
        data: { order_id: order.id }, // Context for notification
      });

      // Step 3: Award points if order completed
      // Completion means successful transaction from creation to delivery
      if (newStatus === "completed") {
        // Seller reward: 50 points for successful sale
        await supabase.rpc("award_points", {
          p_user_id: order.seller_id,
          p_points: 50,
          p_action: "completing a sale",
        });

        // Buyer reward: 25 points for completing purchase
        await supabase.rpc("award_points", {
          p_user_id: order.buyer_id,
          p_points: 25,
          p_action: "completing a purchase",
        });
      }

      // Step 4: Show success feedback
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });

      onStatusChange?.();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    if (userRole === "seller") {
      if (order.status === "requested") {
        actions.push(
          <Button
            key="confirm"
            size="sm"
            onClick={() => updateOrderStatus("confirmed")}
            disabled={loading}
          >
            Confirm Order
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="destructive"
            onClick={() => updateOrderStatus("cancelled")}
            disabled={loading}
          >
            Cancel
          </Button>
        );
      } else if (order.status === "confirmed") {
        actions.push(
          <Button
            key="transit"
            size="sm"
            onClick={() => updateOrderStatus("in-transit")}
            disabled={loading}
          >
            Mark In Transit
          </Button>
        );
      } else if (order.status === "in-transit") {
        actions.push(
          <Button
            key="delivered"
            size="sm"
            onClick={() => updateOrderStatus("delivered")}
            disabled={loading}
          >
            Mark Delivered
          </Button>
        );
      }
    }

    if (userRole === "buyer") {
      if (order.status === "delivered") {
        actions.push(
          <Button
            key="complete"
            size="sm"
            onClick={() => updateOrderStatus("completed")}
            disabled={loading}
          >
            Confirm Receipt
          </Button>
        );
      }
      if (order.status === "completed") {
        actions.push(
          <Button
            key="review"
            size="sm"
            variant="outline"
            onClick={() => setReviewDialogOpen(true)}
          >
            Leave Review
          </Button>
        );
      }
    }

    return actions;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {order.listing?.crop_name || "Product"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {userRole === "buyer"
                  ? `Seller: ${order.seller_profile?.full_name}`
                  : `Buyer: ${order.buyer_profile?.full_name}`}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {order.status}
              </span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Quantity</p>
              <p className="font-semibold">{order.quantity}kg</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-primary">
                KES {order.amount.toLocaleString()}
              </p>
            </div>
          </div>

          {order.delivery_details?.address && (
            <div className="flex gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Delivery Address</p>
                <p className="text-muted-foreground">
                  {order.delivery_details.address}
                </p>
                {order.delivery_details.notes && (
                  <p className="text-muted-foreground italic mt-1">
                    Note: {order.delivery_details.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {getAvailableActions()}
            <Button
              size="sm"
              variant="outline"
              onClick={onMessageClick}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Order created {new Date(order.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        orderId={order.id}
        revieweeId={order.seller_id}
        sellerName={order.seller_profile?.full_name || "Seller"}
      />
    </>
  );
};