/**
 * ORDERS PAGE
 * 
 * Centralized order management interface showing all transactions from both
 * buyer and seller perspectives. Nested within Marketplace section.
 * 
 * PAGE STRUCTURE:
 * - Two tabs: "My Purchases" and "My Sales"
 * - My Purchases: Orders where current user is buyer
 * - My Sales: Orders where current user is seller
 * 
 * KEY FEATURES:
 * 1. Dual perspective order tracking (buy and sell sides)
 * 2. Status-based order filtering and organization
 * 3. Integrated messaging (buyer-seller communication)
 * 4. Status management (confirm, ship, receive, complete)
 * 5. Review system for completed orders
 * 6. Real-time order updates
 * 
 * ORDER LIFECYCLE VISIBILITY:
 * 
 * BUYER VIEW (My Purchases):
 * - See orders they created
 * - Track status from requested → completed
 * - Message sellers about orders
 * - Mark orders as received
 * - Leave reviews on completed orders
 * 
 * SELLER VIEW (My Sales):
 * - See incoming order requests
 * - Confirm or cancel orders
 * - Mark orders as shipped
 * - Message buyers about orders
 * - View completed sales
 * 
 * DATA FETCHING:
 * - Queries orders table twice (once for buy orders, once for sell orders)
 * - Enriches with listing details (crop name, price)
 * - Enriches with profile information (buyer/seller names)
 * - Separate profile fetches due to RLS constraints
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/OrderCard";
import { MessagingDialog } from "@/components/MessagingDialog";
import { ShoppingBag, Store, Loader2 } from "lucide-react";

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

const Orders = () => {
  // ORDER STATE - Separated by user role in transaction
  const [buyOrders, setBuyOrders] = useState<Order[]>([]); // User is buyer
  const [sellOrders, setSellOrders] = useState<Order[]>([]); // User is seller
  const [loading, setLoading] = useState(true); // Initial data fetch
  
  // MESSAGING STATE - For buyer-seller communication
  const [selectedChat, setSelectedChat] = useState<{
    userId: string; // Other party in conversation
    userName: string; // Display name
    listingId: string; // Order context
  } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  /**
   * FETCH ORDERS
   * Retrieves all orders for current user from both buyer and seller perspectives
   * 
   * DUAL QUERY STRATEGY:
   * - Query 1: Orders where user is buyer (purchases)
   * - Query 2: Orders where user is seller (sales)
   * 
   * PROFILE ENRICHMENT:
   * - Buy orders enriched with seller profiles
   * - Sell orders enriched with buyer profiles
   * - Separate profile fetches required due to RLS policies
   * 
   * PROCESS:
   * 1. Get authenticated user
   * 2. Fetch buy orders (user is buyer_id)
   * 3. Extract seller IDs and fetch seller profiles
   * 4. Enrich buy orders with seller names
   * 5. Fetch sell orders (user is seller_id)
   * 6. Extract buyer IDs and fetch buyer profiles
   * 7. Enrich sell orders with buyer names
   * 8. Sort by creation date (newest first)
   * 
   * WHY SEPARATE PROFILES:
   * RLS policies prevent direct joins between orders and profiles.
   * We fetch profiles separately based on extracted user IDs,
   * then merge client-side for display.
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ========== BUYER ORDERS ==========
      // Fetch orders where current user is the buyer
      const { data: buyData, error: buyError } = await supabase
        .from("orders")
        .select(`
          *,
          listing:marketplace_listings(crop_name, price_per_kg)
        `)
        .eq("buyer_id", user.id) // User's purchases
        .order("created_at", { ascending: false }); // Newest first

      if (buyError) throw buyError;

      // Enrich with seller profile information
      const sellerIds = buyData?.map(o => o.seller_id) || [];
      const { data: sellerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", sellerIds);

      // Merge seller profiles with orders
      const buyOrdersWithProfiles = buyData?.map(order => ({
        ...order,
        seller_profile: sellerProfiles?.find(p => p.id === order.seller_id),
      })) || [];

      // ========== SELLER ORDERS ==========
      // Fetch orders where current user is the seller
      const { data: sellData, error: sellError } = await supabase
        .from("orders")
        .select(`
          *,
          listing:marketplace_listings(crop_name, price_per_kg)
        `)
        .eq("seller_id", user.id) // User's sales
        .order("created_at", { ascending: false }); // Newest first

      if (sellError) throw sellError;

      // Enrich with buyer profile information
      const buyerIds = sellData?.map(o => o.buyer_id) || [];
      const { data: buyerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", buyerIds);

      // Merge buyer profiles with orders
      const sellOrdersWithProfiles = sellData?.map(order => ({
        ...order,
        buyer_profile: buyerProfiles?.find(p => p.id === order.buyer_id),
      })) || [];

      // Update state with enriched orders
      setBuyOrders(buyOrdersWithProfiles as any);
      setSellOrders(sellOrdersWithProfiles as any);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your transactions</p>
      </div>

      <Tabs defaultValue="purchases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            My Purchases ({buyOrders.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <Store className="h-4 w-4" />
            My Sales ({sellOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          {buyOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't made any purchases yet</p>
            </div>
          ) : (
            buyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userRole="buyer"
                onStatusChange={fetchOrders}
                onMessageClick={() =>
                  setSelectedChat({
                    userId: order.seller_id,
                    userName: order.seller_profile?.full_name || "Seller",
                    listingId: order.listing_id,
                  })
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {sellOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven't received any orders yet</p>
            </div>
          ) : (
            sellOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userRole="seller"
                onStatusChange={fetchOrders}
                onMessageClick={() =>
                  setSelectedChat({
                    userId: order.buyer_id,
                    userName: order.buyer_profile?.full_name || "Buyer",
                    listingId: order.listing_id,
                  })
                }
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {selectedChat && (
        <MessagingDialog
          open={!!selectedChat}
          onOpenChange={(open) => !open && setSelectedChat(null)}
          otherUserId={selectedChat.userId}
          otherUserName={selectedChat.userName}
          listingId={selectedChat.listingId}
        />
      )}
    </div>
  );
};

export default Orders;