import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { validateAndSanitizeComment } from "@/utils/contentValidation";
import DOMPurify from "dompurify";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (commentsData) {
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
        const enriched = commentsData.map((comment) => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id),
        }));
        setComments(enriched);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Validate and sanitize comment
    const validation = validateAndSanitizeComment(newComment);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: validation.sanitized,
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2 text-sm">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs bg-muted">
              {comment.profiles?.full_name?.[0] || "F"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs">{comment.profiles?.full_name || "Farmer"}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <div 
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
            />
          </div>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            disabled={loading}
            maxLength={500}
            className="pr-16"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {newComment.length}/500
          </span>
        </div>
        <Button type="submit" size="sm" disabled={loading || !newComment.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default CommentSection;
