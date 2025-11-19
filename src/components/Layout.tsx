/**
 * LAYOUT COMPONENT
 * 
 * Main application shell providing navigation, authentication, and global UI elements.
 * Wraps all authenticated pages with header, navigation tabs, and user information.
 * 
 * @component
 * @example
 * ```tsx
 * <Layout>
 *   <Dashboard />
 * </Layout>
 * ```
 */

import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, TrendingUp, Store, Users, LogOut, Sprout, Trophy, ShoppingBag, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter } from "./NotificationCenter";
import { UserStatsDisplay } from "./UserStatsDisplay";
import { ReferralButton } from "./ReferralButton";
import { NotificationPermissionPrompt } from "./NotificationPermissionPrompt";

/**
 * Props for the Layout component
 * @interface LayoutProps
 * @property {React.ReactNode} children - Page content to render within the layout
 */
interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user && location.pathname !== "/auth") {
      navigate("/auth", { replace: true });
    } else if (user && location.pathname === "/auth") {
      navigate("/", { replace: true });
    }
  }, [user, location.pathname, navigate, loading]);

  useEffect(() => {
    if (!user) return;

    const fetchNotificationCounts = async () => {
      // Fetch unread notifications count
      const { count: notifCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setUnreadNotifications(notifCount || 0);

      // Fetch pending orders count (as buyer or seller)
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .in("status", ["pending", "confirmed", "in_transit"]);

      setPendingOrders(orderCount || 0);
    };

    fetchNotificationCounts();

    // Subscribe to realtime updates
    const notificationsChannel = supabase
      .channel("notifications_count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotificationCounts()
      )
      .subscribe();

    const ordersChannel = supabase
      .channel("orders_count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => fetchNotificationCounts()
      )
      .subscribe();

    return () => {
      notificationsChannel.unsubscribe();
      ordersChannel.unsubscribe();
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/auth");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/market-intel", label: "Market Intel", icon: TrendingUp },
    { path: "/marketplace", label: "Marketplace", icon: Store },
    { path: "/social", label: "Social", icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4 animate-pulse">
            <Sprout className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
              <Sprout className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">shambaXchange</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className="gap-2 relative"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.path === "/social" && unreadNotifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] flex items-center justify-center"
                    >
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </Badge>
                  )}
                  {item.path === "/marketplace" && pendingOrders > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] flex items-center justify-center"
                    >
                      {pendingOrders > 99 ? "99+" : pendingOrders}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <UserStatsDisplay />
            <ReferralButton />
            <NotificationCenter />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <NotificationPermissionPrompt />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card shadow-lg z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                className="w-full flex-col h-auto py-2 gap-1 relative"
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.path === "/social" && unreadNotifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[8px] flex items-center justify-center"
                    >
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </Badge>
                  )}
                  {item.path === "/marketplace" && pendingOrders > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[8px] flex items-center justify-center"
                    >
                      {pendingOrders > 99 ? "99+" : pendingOrders}
                    </Badge>
                  )}
                </div>
                <span className="text-[9px]">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
