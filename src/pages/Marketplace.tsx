import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, MessageCircle, Package, Loader2, ShoppingCart, ShoppingBag, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddListingDialog from "@/components/AddListingDialog";
import { CreateOrderDialog } from "@/components/CreateOrderDialog";
import { MessagingDialog } from "@/components/MessagingDialog";
import { OrderCard } from "@/components/OrderCard";

interface Listing {
  id: string;
  crop_name: string;
  quantity: number;
  price_per_kg: number;
  location: string;
  seller_id: string;
  profiles?: {
    full_name: string;
  };
}

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

const Marketplace = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [addListingOpen, setAddListingOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [messagingDialogOpen, setMessagingDialogOpen] = useState(false);
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<{
    userId: string;
    userName: string;
    listingId: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
    fetchOrders();
  }, []);

  const fetchListings = async () => {
    try {
      const { data: listingsData, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (listingsData) {
        const userIds = [...new Set(listingsData.map((l) => l.seller_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
        const enriched = listingsData.map((listing) => ({
          ...listing,
          profiles: profilesMap.get(listing.seller_id),
        }));
        setListings(enriched);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to load listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (listing: Listing) => {
    setSelectedListing(listing);
    setMessagingDialogOpen(true);
  };

  const handleBuy = (listing: Listing) => {
    setSelectedListing(listing);
    setOrderDialogOpen(true);
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
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
      setOrdersLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Marketplace</h1>
          <p className="text-muted-foreground">Buy, sell, and manage your transactions</p>
        </div>
        <Button onClick={() => setAddListingOpen(true)}>
          <Package className="w-4 h-4 mr-2" />
          List Your Produce
        </Button>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="gap-2">
            <Store className="h-4 w-4" />
            Browse Listings
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            My Orders ({buyOrders.length + sellOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Listings</CardTitle>
                  <CardDescription>Available produce from verified sellers</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No listings yet. Be the first to list your produce!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {listings.map((listing) => (
                        <div key={listing.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{listing.crop_name}</h3>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span>Seller: {listing.profiles?.full_name || "Farmer"}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {listing.location}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-4">
                                <span className="text-sm">Quantity: <strong>{listing.quantity}kg</strong></span>
                                <span className="text-lg font-bold text-primary">KES {listing.price_per_kg}/kg</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 w-full sm:w-auto">
                              <Button 
                                size="sm"
                                onClick={() => handleBuy(listing)}
                                className="w-full gap-2"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Buy Now
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleContact(listing)}
                                className="w-full gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>Tips for your marketplace success</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-medium">💰 Pricing Tip</p>
                      <p className="text-xs text-muted-foreground">
                        Tomato prices are up 12% this week - good time to list your harvest!
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-lg border-l-4 border-secondary">
                      <p className="text-sm font-medium">📊 Market Demand</p>
                      <p className="text-xs text-muted-foreground">
                        High demand for leafy greens in Nairobi - consider diversifying your crops.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {ordersLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No purchases yet</p>
                      <p className="text-sm text-muted-foreground">Browse listings to make your first purchase</p>
                    </CardContent>
                  </Card>
                ) : (
                  buyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      userRole="buyer"
                      onStatusChange={fetchOrders}
                      onMessageClick={() => {
                        setSelectedChat({
                          userId: order.seller_id,
                          userName: order.seller_profile?.full_name || "Seller",
                          listingId: order.listing_id,
                        });
                      }}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="sales" className="space-y-4">
                {sellOrders.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Store className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No sales yet</p>
                      <p className="text-sm text-muted-foreground">List your produce to start selling</p>
                    </CardContent>
                  </Card>
                ) : (
                  sellOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      userRole="seller"
                      onStatusChange={fetchOrders}
                      onMessageClick={() => {
                        setSelectedChat({
                          userId: order.buyer_id,
                          userName: order.buyer_profile?.full_name || "Buyer",
                          listingId: order.listing_id,
                        });
                      }}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>

      <AddListingDialog 
        open={addListingOpen} 
        onOpenChange={setAddListingOpen}
        onSuccess={fetchListings}
      />

      {selectedListing && (
        <>
          <CreateOrderDialog
            open={orderDialogOpen}
            onOpenChange={setOrderDialogOpen}
            listingId={selectedListing.id}
            sellerId={selectedListing.seller_id}
            cropName={selectedListing.crop_name}
            pricePerKg={selectedListing.price_per_kg}
            availableQuantity={selectedListing.quantity}
            onOrderCreated={() => {
              setOrderDialogOpen(false);
              fetchOrders();
              toast({
                title: "Order created",
                description: "Your order has been submitted successfully.",
              });
            }}
          />
          <MessagingDialog
            open={messagingDialogOpen}
            onOpenChange={setMessagingDialogOpen}
            otherUserId={selectedListing.seller_id}
            otherUserName={selectedListing.profiles?.full_name || "Seller"}
            listingId={selectedListing.id}
          />
        </>
      )}

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

export default Marketplace;
