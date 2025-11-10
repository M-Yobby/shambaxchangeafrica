import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageCircle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Marketplace = () => {
  const { toast } = useToast();

  const listings = [
    { id: 1, crop: "Tomatoes", seller: "John M.", quantity: 500, price: 85, location: "Kisii", verified: true },
    { id: 2, crop: "Cabbages", seller: "Mary K.", quantity: 300, price: 45, location: "Nakuru", verified: true },
    { id: 3, crop: "Maize", seller: "Peter O.", quantity: 1000, price: 52, location: "Eldoret", verified: false },
    { id: 4, crop: "Beans", seller: "Grace W.", quantity: 200, price: 120, location: "Nyeri", verified: true },
  ];

  const buyerRequests = [
    { id: 1, crop: "Onions", buyer: "Hotel Chain", quantity: 800, location: "Nairobi", maxPrice: 65 },
    { id: 2, crop: "Potatoes", buyer: "Restaurant Group", quantity: 500, location: "Mombasa", maxPrice: 40 },
  ];

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
        <Button>
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
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{listing.crop}</h3>
                          {listing.verified && (
                            <Badge variant="default" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Seller: {listing.seller}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.location}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-sm">Quantity: <strong>{listing.quantity}kg</strong></span>
                          <span className="text-lg font-bold text-primary">KES {listing.price}/kg</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleContact(listing.seller)}
                        className="w-full sm:w-auto"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buyer Requests</CardTitle>
              <CardDescription>Active purchase requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buyerRequests.map((request) => (
                  <div key={request.id} className="p-3 border rounded-lg">
                    <p className="font-medium mb-1">{request.crop}</p>
                    <p className="text-sm text-muted-foreground mb-2">{request.buyer}</p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>Quantity: {request.quantity}kg</p>
                      <p>Max Price: KES {request.maxPrice}/kg</p>
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {request.location}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" className="w-full mt-3">
                      Make Offer
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Match</CardTitle>
              <CardDescription>Top matches for you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium mb-1">Perfect Match</p>
                  <p className="text-xs text-muted-foreground">
                    Hotel Chain needs onions in Nairobi. Your location and stock align perfectly.
                  </p>
                  <Button size="sm" variant="link" className="p-0 h-auto mt-2">
                    View Request →
                  </Button>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg border-l-4 border-secondary">
                  <p className="text-sm font-medium mb-1">Good Opportunity</p>
                  <p className="text-xs text-muted-foreground">
                    Restaurant Group buying potatoes at competitive rates in Mombasa.
                  </p>
                  <Button size="sm" variant="link" className="p-0 h-auto mt-2">
                    View Request →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
