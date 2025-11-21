/**
 * SOCIAL PAGE
 * 
 * Social networking hub for farmers to share posts, interact with community,
 * and view leaderboards. Features infinite scroll, media upload, pull-to-refresh,
 * lazy-loaded media, and trending posts sidebar.
 * 
 * @page
 * @example
 * ```tsx
 * <Route path="/social" element={<Social />} />
 * ```
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Share2, Send, TrendingUp, Loader2, Image as ImageIcon, Trophy, RefreshCw, DollarSign, Users, Flame, MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import CommentSection from "@/components/CommentSection";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { useCompleteReferral } from "@/hooks/useCompleteReferral";
import { validateAndSanitizePost, sanitizeContent } from "@/utils/contentValidation";
import DOMPurify from "dompurify";
import { compressImage } from "@/utils/imageCompression";
import { LazyMedia } from "@/components/LazyMedia";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Social post data structure
 * @interface Post
 */
interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  shares_count: number;
  media_url: string | null;
  profiles?: {
    full_name: string;
    location: string;
  };
  user_liked?: boolean;
}

/**
 * Leaderboard entry for social rankings
 * @interface LeaderboardEntry
 */
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  location: string;
  total_sales: number;
  completed_orders: number;
  avg_rating: number;
  total_reviews: number;
  points: number;
  level: number;
  streak_days: number;
  total_posts: number;
  total_likes_received: number;
  total_likes_given: number;
  total_comments: number;
}

const Social = () => {
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [leaderboardsLoading, setLeaderboardsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [regions, setRegions] = useState<string[]>([]);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { completeReferral } = useCompleteReferral();

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
    fetchTrendingPosts();
    fetchLeaderboards();
    fetchRegions();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    const POSTS_PER_PAGE = 10;
    await fetchPosts(nextPage * POSTS_PER_PAGE, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    setHasMore(true);
    await Promise.all([
      fetchPosts(0, false),
      fetchTrendingPosts(),
    ]);
    setIsRefreshing(false);
    setPullDistance(0);
    setIsPulling(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = feedContainerRef.current;
    if (!container) return;
    
    // Only enable pull-to-refresh when scrolled to the top
    if (container.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = feedContainerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;
    
    // Only allow pulling down (positive distance) when at top
    if (distance > 0 && container.scrollTop === 0) {
      setIsPulling(true);
      // Apply diminishing returns for smooth feel
      setPullDistance(Math.min(distance * 0.5, 100));
    }
  };

  const handleTouchEnd = () => {
    const PULL_THRESHOLD = 60;
    
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const fetchTrendingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("likes_count", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data) {
        const userIds = [...new Set(data.map((p) => p.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, location")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
        const enriched = data.map((post) => ({
          ...post,
          profiles: profilesMap.get(post.user_id),
        }));
        setTrendingPosts(enriched);
      }
    } catch (error) {
      console.error("Error fetching trending:", error);
    }
  };

  const fetchPosts = async (offset: number = 0, append: boolean = false) => {
    const POSTS_PER_PAGE = 10;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (error) throw error;

      if (!postsData) {
        setPosts([]);
        setLoading(false);
        setHasMore(false);
        return;
      }

      // If we got fewer posts than requested, there are no more posts
      if (postsData.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      // Fetch profiles separately
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, location")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Check which posts current user has liked
      if (user && postsData) {
        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postsData.map(p => p.id));

        const likedPostIds = new Set(likesData?.map(l => l.post_id) || []);
        
        const enrichedPosts = postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.user_id),
          user_liked: likedPostIds.has(post.id),
        }));
        
        setPosts(prev => append ? [...prev, ...enrichedPosts] : enrichedPosts);
      } else {
        const enrichedPosts = postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.user_id),
        }));
        setPosts(prev => append ? [...prev, ...enrichedPosts] : enrichedPosts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image before setting it
        const compressedFile = await compressImage(file);
        setMediaFile(compressedFile);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process image"
        });
      }
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() && !mediaFile) return;

    // Validate and sanitize post content
    const validation = validateAndSanitizePost(postContent);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let mediaUrl: string | null = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("post-media")
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        content: validation.sanitized,
        user_id: user.id,
        media_url: mediaUrl,
      });

      if (error) throw error;

      // Award points for posting
      await supabase.rpc("award_points", {
        p_user_id: user.id,
        p_points: 15,
        p_action: "creating a post",
      });

      // Complete referral if this is first activity
      await completeReferral();

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
      setPostContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setPage(0);
      setHasMore(true);
      fetchPosts(0, false);
      fetchTrendingPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isLiked) {
        // Unlike
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (!deleteError) {
          // Update likes count
          const post = posts.find(p => p.id === postId);
          if (post) {
            await supabase
              .from("posts")
              .update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) })
              .eq("id", postId);
          }
        }
      } else {
        // Like
        const { error: insertError } = await supabase.from("likes").insert({
          post_id: postId,
          user_id: user.id,
        });

        if (!insertError) {
          // Update likes count
          const post = posts.find(p => p.id === postId);
          if (post) {
            await supabase
              .from("posts")
              .update({ likes_count: (post.likes_count || 0) + 1 })
              .eq("id", postId);
          }
        }
      }

      fetchPosts(0, false);
      setPage(0);
      setHasMore(true);
      fetchTrendingPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        description: isLiked ? "Failed to unlike" : "Failed to like post",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      await supabase
        .from("posts")
        .update({ shares_count: (post.shares_count || 0) + 1 })
        .eq("id", postId);

      toast({
        title: "Shared!",
        description: "Post shared to your network",
      });
      fetchPosts(0, false);
      setPage(0);
      setHasMore(true);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your post has been removed",
      });
      
      // Refresh posts
      setPage(0);
      setHasMore(true);
      fetchPosts(0, false);
      fetchTrendingPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location')
        .not('location', 'is', null);

      if (error) throw error;

      const uniqueRegions = [...new Set(data.map(p => p.location))].filter(Boolean);
      setRegions(uniqueRegions);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchLeaderboards = async () => {
    try {
      setLeaderboardsLoading(true);
      
      let query = supabase
        .from('leaderboards')
        .select('*');

      if (selectedRegion !== "all") {
        query = query.eq('location', selectedRegion);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLeaderboards(data || []);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboards",
        variant: "destructive",
      });
    } finally {
      setLeaderboardsLoading(false);
    }
  };

  const refreshLeaderboards = async () => {
    try {
      toast({
        title: "Refreshing...",
        description: "Updating leaderboard data",
      });

      const { error } = await supabase.functions.invoke('refresh-leaderboard');

      if (error) throw error;

      await fetchLeaderboards();

      toast({
        title: "Success",
        description: "Leaderboards refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing leaderboards:', error);
      toast({
        title: "Error",
        description: "Failed to refresh leaderboards",
        variant: "destructive",
      });
    }
  };

  const getTopSellers = () => {
    return [...leaderboards]
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 10);
  };

  const getTopByPoints = () => {
    return [...leaderboards]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  };

  const getTopBySocialEngagement = () => {
    return [...leaderboards]
      .sort((a, b) => {
        const engagementA = a.total_likes_received + a.total_comments;
        const engagementB = b.total_likes_received + b.total_comments;
        return engagementB - engagementA;
      })
      .slice(0, 10);
  };

  const getTopStreaks = () => {
    return [...leaderboards]
      .sort((a, b) => b.streak_days - a.streak_days)
      .slice(0, 10);
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedRegion]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Social Hub</h1>
        <p className="text-muted-foreground">Connect with farmers and see top performers</p>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed" className="gap-2">
            <Users className="h-4 w-4" />
            Community Feed
          </TabsTrigger>
          <TabsTrigger value="leaderboards" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">F</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Share your farming experience..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={2000}
                  />
                  {mediaPreview && (
                    <div className="relative mt-2 bg-muted rounded-lg">
                      {mediaFile?.type.startsWith('video/') ? (
                        <video 
                          src={mediaPreview} 
                          controls 
                          className="w-full max-h-96 rounded-lg object-contain"
                        />
                      ) : (
                        <img 
                          src={mediaPreview} 
                          alt="Preview" 
                          className="w-full max-h-96 rounded-lg object-contain"
                        />
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleMediaSelect}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Photo
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {postContent.length}/2000
                      </span>
                    </div>
                    <Button onClick={handlePost} disabled={!postContent.trim() && !mediaFile}>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div 
            ref={feedContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
            style={{
              transform: isPulling ? `translateY(${pullDistance}px)` : 'none',
              transition: isPulling ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            {/* Pull to refresh indicator */}
            {(isPulling || isRefreshing) && (
              <div 
                className="absolute -top-16 left-0 right-0 flex items-center justify-center h-16"
                style={{ opacity: Math.min(pullDistance / 60, 1) }}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm">
                    {isRefreshing ? 'Refreshing...' : pullDistance >= 60 ? 'Release to refresh' : 'Pull to refresh'}
                  </span>
                </div>
              </div>
            )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No posts yet. Be the first to share!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {post.profiles?.full_name?.[0] || "F"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{post.profiles?.full_name || "Farmer"}</p>
                            <p className="text-sm text-muted-foreground">
                              {post.profiles?.location || "Kenya"} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {currentUserId === post.user_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div 
                          className="text-sm mb-2 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                        />
                        {post.media_url && (
                          <LazyMedia
                            src={post.media_url}
                            alt="Post media"
                            isVideo={post.media_url.includes('video') || !!post.media_url.match(/\.(mp4|webm|ogg)$/i)}
                            className="w-full max-h-[500px] rounded-lg object-contain"
                            containerClassName="bg-muted rounded-lg mb-4"
                          />
                        )}
                        <div className="flex items-center gap-6 text-muted-foreground">
                          <button 
                            className={`flex items-center gap-2 transition-colors ${
                              post.user_liked ? "text-destructive" : "hover:text-destructive"
                            }`}
                            onClick={() => handleLike(post.id, post.user_liked || false)}
                          >
                            <Heart className={`w-4 h-4 ${post.user_liked ? "fill-current" : ""}`} />
                            <span className="text-sm">{post.likes_count || 0}</span>
                          </button>
                          <button
                            className="flex items-center gap-2 hover:text-accent transition-colors"
                            onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            className="flex items-center gap-2 hover:text-secondary transition-colors"
                            onClick={() => handleShare(post.id)}
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="text-sm">{post.shares_count || 0}</span>
                          </button>
                        </div>
                        {showComments === post.id && (
                          <CommentSection 
                            postId={post.id} 
                            postOwnerId={post.user_id}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="py-4">
                {loadingMore && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No more posts to load
                  </p>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-secondary/10 rounded-lg border border-secondary">
                  <p className="text-sm font-medium mb-2">🌟 Featured Sponsor</p>
                  <img 
                    src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400" 
                    alt="Sponsor" 
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <p className="text-xs mb-2">Master Sustainable Farming Techniques</p>
                  <Button size="sm" variant="secondary" className="w-full">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Trending Posts</h3>
              </div>
              <div className="space-y-3">
                {trendingPosts.map((post) => (
                  <button 
                    key={post.id}
                    className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div 
                      className="font-medium text-sm line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                    />
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {post.likes_count}
                      </span>
                      <span>• {post.profiles?.full_name || "Farmer"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="leaderboards" className="space-y-6">
      {leaderboardsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-muted-foreground">Top performing farmers in the community</p>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={refreshLeaderboards} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="sellers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sellers">
                <DollarSign className="h-4 w-4 mr-2" />
                Top Sellers
              </TabsTrigger>
              <TabsTrigger value="points">
                <Trophy className="h-4 w-4 mr-2" />
                Points
              </TabsTrigger>
              <TabsTrigger value="social">
                <Users className="h-4 w-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="streaks">
                <Flame className="h-4 w-4 mr-2" />
                Streaks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sellers">
              <LeaderboardCard
                entries={getTopSellers()}
                title="Top Sellers"
                description="Farmers with highest sales revenue"
                metric="total_sales"
                formatValue={(v) => `KES ${v.toLocaleString()}`}
                icon={<DollarSign className="h-5 w-5" />}
              />
            </TabsContent>

            <TabsContent value="points">
              <LeaderboardCard
                entries={getTopByPoints()}
                title="Top by Points"
                description="Most active community members"
                metric="points"
                formatValue={(v) => `${v.toLocaleString()} pts`}
                icon={<Trophy className="h-5 w-5" />}
              />
            </TabsContent>

            <TabsContent value="social">
              <LeaderboardCard
                entries={getTopBySocialEngagement()}
                title="Social Leaders"
                description="Most engaging farmers on the platform"
                metric="total_likes_received"
                formatValue={(v, entry) => `${(entry?.total_likes_received || 0) + (entry?.total_comments || 0)} interactions`}
                icon={<Users className="h-5 w-5" />}
              />
            </TabsContent>

            <TabsContent value="streaks">
              <LeaderboardCard
                entries={getTopStreaks()}
                title="Longest Streaks"
                description="Most consistent daily users"
                metric="streak_days"
                formatValue={(v) => `${v} days`}
                icon={<Flame className="h-5 w-5" />}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </TabsContent>
  </Tabs>
</div>
  );
};

export default Social;
