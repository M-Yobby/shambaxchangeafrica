import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Send, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  profiles?: {
    full_name: string;
    location: string;
  };
  user_liked?: boolean;
}

const Social = () => {
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const trending = [
    { topic: "#ClimateSmartFarming", posts: 145 },
    { topic: "#TomatoPrices", posts: 89 },
    { topic: "#OrganicFarming", posts: 67 },
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!postsData) {
        setPosts([]);
        setLoading(false);
        return;
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
        
        setPosts(enrichedPosts);
      } else {
        const enrichedPosts = postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.user_id),
        }));
        setPosts(enrichedPosts);
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

  const handlePost = async () => {
    if (!postContent.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("posts").insert({
        content: postContent,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
      setPostContent("");
      fetchPosts();
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

      fetchPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        description: isLiked ? "Failed to unlike" : "Failed to like post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Shamba Social</h1>
        <p className="text-muted-foreground">Connect with fellow farmers</p>
      </div>

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
                    maxLength={300}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {postContent.length}/300
                    </span>
                    <Button onClick={handlePost} disabled={!postContent.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                        </div>
                        <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
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
                          <button className="flex items-center gap-2 hover:text-accent transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">0</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-secondary transition-colors">
                            <Share2 className="w-4 h-4" />
                            <span className="text-sm">0</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                <h3 className="font-semibold">Trending Topics</h3>
              </div>
              <div className="space-y-3">
                {trending.map((item) => (
                  <button 
                    key={item.topic}
                    className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <p className="font-medium text-sm text-primary">{item.topic}</p>
                    <p className="text-xs text-muted-foreground">{item.posts} posts</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Social;
