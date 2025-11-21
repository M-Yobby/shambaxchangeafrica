/**
 * COMMENT SECTION COMPONENT
 * 
 * Displays and manages comments on social posts.
 * Enables threaded discussions and community engagement.
 * 
 * KEY FEATURES:
 * 1. Real-time comment display with user profiles
 * 2. Comment creation with validation and sanitization
 * 3. Chronological ordering (oldest first for thread context)
 * 4. XSS protection via content validation
 * 5. Relative timestamps (e.g., "5 minutes ago")
 * 6. User avatars and names
 * 
 * ENGAGEMENT TRACKING:
 * - Comments contribute to post's engagement score
 * - Used in trending algorithm calculations
 * - Affect user's social metrics in leaderboards
 * - Generate notifications for post authors
 * 
 * SECURITY MEASURES:
 * - Content validation (max 500 characters)
 * - HTML sanitization (XSS prevention)
 * - URL protocol validation
 * - Authentication required
 * 
 * DATABASE OPERATIONS:
 * - Fetches: comments table with profile joins
 * - Inserts: new comments with sanitized content
 * - RLS: Users can comment on any authenticated post
 * 
 * USAGE:
 * ```typescript
 * <CommentSection postId={post.id} />
 * ```
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { validateAndSanitizeComment } from "@/utils/contentValidation";
import DOMPurify from "dompurify";

/**
 * Comment Interface
 * Represents a comment with user profile information
 */
interface Comment {
  id: string;
  content: string; // HTML-sanitized content
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface CommentSectionProps {
  postId: string; // Post these comments belong to
  postOwnerId: string; // ID of the post owner
}

const CommentSection = ({ postId, postOwnerId }: CommentSectionProps) => {
  // COMMENT STATE
  const [comments, setComments] = useState<Comment[]>([]); // All comments for this post
  const [newComment, setNewComment] = useState(""); // Comment being typed
  const [loading, setLoading] = useState(false); // Submission in progress
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * INITIALIZATION
   * Fetch comments and current user when component mounts or postId changes
   */
  useEffect(() => {
    fetchCurrentUser();
    fetchComments();
  }, [postId]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  /**
   * FETCH COMMENTS
   * Retrieves all comments for the post with user profile information
   * 
   * PROCESS:
   * 1. Query comments table for this post
   * 2. Order chronologically (ascending = oldest first)
   * 3. Extract unique user IDs from comments
   * 4. Fetch user profiles separately (RLS-compliant)
   * 5. Enrich comments with profile data
   * 
   * WHY OLDEST FIRST:
   * - Provides thread context (read conversation in order)
   * - Similar to traditional forum threading
   * - Makes following discussions easier
   * 
   * WHY SEPARATE PROFILE FETCH:
   * - RLS policies prevent direct join
   * - Fetch profiles separately and merge client-side
   * - More efficient than multiple queries per comment
   */
  const fetchComments = async () => {
    try {
      // Step 1: Fetch all comments for this post
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId) // Filter by post
        .order("created_at", { ascending: true }); // Oldest first

      if (error) throw error;

      if (commentsData) {
        // Step 2: Extract unique user IDs
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        
        // Step 3: Fetch all user profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        // Step 4: Create lookup map for O(1) profile access
        const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
        
        // Step 5: Enrich comments with profile data
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

  /**
   * HANDLE SUBMIT
   * Creates new comment with validation and sanitization
   * 
   * PROCESS:
   * 1. Prevent empty comments
   * 2. Validate content (length, URLs, XSS)
   * 3. Sanitize HTML
   * 4. Get authenticated user
   * 5. Insert comment into database
   * 6. Clear input and refresh comments
   * 
   * VALIDATION:
   * - Max 500 characters
   * - URL protocol check (http/https only)
   * - HTML sanitization (XSS prevention)
   * - Empty comment prevention
   * 
   * DATABASE OPERATION:
   * INSERT INTO comments (
   *   post_id,      -- Post being commented on
   *   user_id,      -- Current authenticated user
   *   content       -- Sanitized comment text
   * )
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Step 1: Prevent empty comments
    if (!newComment.trim()) return;

    // Step 2: Validate and sanitize comment content
    // Checks length (max 500 chars), URLs, and sanitizes HTML
    const validation = validateAndSanitizeComment(newComment);
    if (!validation.success) {
      // Show validation error to user
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Step 3: Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Step 4: Insert sanitized comment into database
      const { error } = await supabase.from("comments").insert({
        post_id: postId, // Link to parent post
        user_id: user.id, // Comment author
        content: validation.sanitized, // XSS-safe content
      });

      if (error) throw error;

      // Step 5: Clear input and refresh comments list
      setNewComment("");
      fetchComments(); // Reload to show new comment
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

  /**
   * HANDLE DELETE COMMENT
   * Deletes a comment (allowed for comment owner or post owner)
   */
  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        description: "Comment deleted",
      });
      fetchComments(); // Refresh comments list
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        description: "Failed to delete comment",
        variant: "destructive",
      });
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">{comment.profiles?.full_name || "Farmer"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              {(currentUserId === comment.user_id || currentUserId === postOwnerId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
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
