import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageCircle, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddListingDialog from "@/components/AddListingDialog";

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

const Marketplace = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [addListingOpen, setAddListingOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
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

  const handleContact = (seller: string) => {
    toast({
      title: "Contact Seller",
      description: `Opening chat with ${seller}...`,
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell produce directly</p>
        </div>
        <Button onClick={() => setAddListingOpen(true)}>
          <Package className="w-4 h-4 mr-2" />
          List Your Produce
        </Button>
      </div>

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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleContact(listing.profiles?.full_name || "Seller")}
                          className="w-full sm:w-auto"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact
                        </Button>
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
      <AddListingDialog 
        open={addListingOpen} 
        onOpenChange={setAddListingOpen}
        onSuccess={fetchListings}
      />
    </div>
  );
};

export default Marketplace;
