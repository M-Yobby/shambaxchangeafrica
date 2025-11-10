import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Send, TrendingUp, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import CommentSection from "@/components/CommentSection";

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

const Social = () => {
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    fetchTrendingPosts();
  }, []);

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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() && !mediaFile) return;

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
        content: postContent,
        user_id: user.id,
        media_url: mediaUrl,
      });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
      setPostContent("");
      setMediaFile(null);
      setMediaPreview(null);
      fetchPosts();
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

      fetchPosts();
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
      fetchPosts();
    } catch (error) {
      console.error("Error sharing:", error);
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
                  {mediaPreview && (
                    <div className="relative mt-2">
                      <img src={mediaPreview} alt="Preview" className="max-h-48 rounded-lg" />
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
                        accept="image/*"
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
                        {postContent.length}/300
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
                        <p className="text-sm mb-2 whitespace-pre-wrap">{post.content}</p>
                        {post.media_url && (
                          <img src={post.media_url} alt="Post media" className="rounded-lg mb-4 max-h-96 w-full object-cover" />
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
                        {showComments === post.id && <CommentSection postId={post.id} />}
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
                <h3 className="font-semibold">Trending Posts</h3>
              </div>
              <div className="space-y-3">
                {trendingPosts.map((post) => (
                  <button 
                    key={post.id}
                    className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                  >
                    <p className="font-medium text-sm line-clamp-2">{post.content}</p>
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
    </div>
  );
};

export default Social;
