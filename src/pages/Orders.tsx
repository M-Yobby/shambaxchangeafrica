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
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<{
    userId: string;
    userName: string;
    listingId: string;
  } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch orders where user is buyer
      const { data: buyData, error: buyError } = await supabase
        .from("orders")
        .select(`
          *,
          listing:marketplace_listings(crop_name, price_per_kg)
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (buyError) throw buyError;

      // Fetch seller profiles separately
      const sellerIds = buyData?.map(o => o.seller_id) || [];
      const { data: sellerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", sellerIds);

      const buyOrdersWithProfiles = buyData?.map(order => ({
        ...order,
        seller_profile: sellerProfiles?.find(p => p.id === order.seller_id),
      })) || [];

      // Fetch orders where user is seller
      const { data: sellData, error: sellError } = await supabase
        .from("orders")
        .select(`
          *,
          listing:marketplace_listings(crop_name, price_per_kg)
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (sellError) throw sellError;

      // Fetch buyer profiles separately
      const buyerIds = sellData?.map(o => o.buyer_id) || [];
      const { data: buyerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", buyerIds);

      const sellOrdersWithProfiles = sellData?.map(order => ({
        ...order,
        buyer_profile: buyerProfiles?.find(p => p.id === order.buyer_id),
      })) || [];

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