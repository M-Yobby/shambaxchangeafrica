import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Sprout, Gift } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Check if there's a referral code in the URL
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const location = formData.get("location") as string;
    const referralCodeInput = formData.get("referralCode") as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          location: location,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Process referral if code was provided
    if (data.user && referralCodeInput) {
      try {
        await supabase.rpc("process_referral", {
          p_new_user_id: data.user.id,
          p_referral_code: referralCodeInput.toUpperCase(),
        });
      } catch (refError) {
        console.error("Error processing referral:", refError);
        // Don't fail signup if referral processing fails
      }
    }

    setLoading(false);
    toast({
      title: "Success",
      description: referralCodeInput 
        ? "Account created with referral bonus! Please check your email to verify."
        : "Account created! Please check your email to verify.",
    });
    navigate("/");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Sprout className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">shambaXchange</h1>
          <p className="text-muted-foreground mt-2">AI-powered platform for African farmers</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your shambaXchange account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Join the farming community</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {referralCode && (
                      <Alert className="bg-primary/10 border-primary">
                        <Gift className="h-4 w-4" />
                        <AlertDescription>
                          You're signing up with a referral code! You'll earn 50 bonus points.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-fullName">Full Name</Label>
                      <Input
                        id="signup-fullName"
                        name="fullName"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-location">Location</Label>
                      <Input
                        id="signup-location"
                        name="location"
                        placeholder="Nairobi, Kenya"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="farmer@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-referralCode">
                        Referral Code (Optional)
                      </Label>
                      <Input
                        id="signup-referralCode"
                        name="referralCode"
                        placeholder="Enter referral code"
                        defaultValue={referralCode}
                        className="uppercase"
                        maxLength={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        Have a referral code? Enter it to earn bonus points!
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
