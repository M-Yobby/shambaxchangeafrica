import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Send, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Social = () => {
  const [postContent, setPostContent] = useState("");
  const { toast } = useToast();

  const posts = [
    {
      id: 1,
      author: "John Mwangi",
      location: "Kisii",
      content: "Just harvested my tomatoes! The AI recommendations from shambaXchange helped me time it perfectly. Prices are great right now! 🍅",
      likes: 24,
      comments: 8,
      shares: 3,
      time: "2h ago",
    },
    {
      id: 2,
      author: "Mary Wanjiku",
      location: "Nakuru",
      content: "Anyone dealing with aphids on cabbages? Looking for organic solutions that work.",
      likes: 15,
      comments: 12,
      shares: 1,
      time: "4h ago",
    },
    {
      id: 3,
      author: "Peter Omondi",
      location: "Eldoret",
      content: "Market Intel was right - maize prices are stabilizing. Holding my stock paid off!",
      likes: 31,
      comments: 6,
      shares: 5,
      time: "1d ago",
    },
  ];

  const trending = [
    { topic: "#ClimateSmartFarming", posts: 145 },
    { topic: "#TomatoPrices", posts: 89 },
    { topic: "#OrganicFarming", posts: 67 },
  ];

  const handlePost = () => {
    if (postContent.trim()) {
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
      setPostContent("");
    }
  };

  const handleLike = (postId: number) => {
    toast({
      description: "Post liked!",
    });
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

          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {post.author[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{post.author}</p>
                          <p className="text-sm text-muted-foreground">{post.location} • {post.time}</p>
                        </div>
                      </div>
                      <p className="text-sm mb-4">{post.content}</p>
                      <div className="flex items-center gap-6 text-muted-foreground">
                        <button 
                          className="flex items-center gap-2 hover:text-destructive transition-colors"
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-accent transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-secondary transition-colors">
                          <Share2 className="w-4 h-4" />
                          <span className="text-sm">{post.shares}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
