/**
 * REVIEW DIALOG
 * 
 * Form for buyers to rate and review sellers after completed transactions.
 * Reviews build seller reputation and provide feedback for the marketplace community.
 * 
 * REVIEW FLOW:
 * 1. Order reaches "completed" status
 * 2. Buyer sees "Leave Review" button in OrderCard
 * 3. Dialog opens with star rating and optional comment
 * 4. Buyer selects 1-5 star rating (required)
 * 5. Buyer optionally adds written feedback
 * 6. On submit → creates review record
 * 7. Seller receives notification of new review
 * 8. Review contributes to seller's average rating
 * 
 * RATING SYSTEM:
 * - 1 star: Poor
 * - 2 stars: Fair
 * - 3 stars: Good
 * - 4 stars: Great
 * - 5 stars: Excellent
 * 
 * REPUTATION BUILDING:
 * - Reviews stored in reviews table
 * - Average rating calculated for each seller
 * - High ratings lead to "Verified Seller" badges (5+ rated transactions)
 * - Ratings visible in marketplace listings
 * - Helps buyers make informed purchase decisions
 * 
 * DATABASE INTEGRATION:
 * - Inserts into: reviews table
 * - Links: order_id, reviewer_id (buyer), reviewee_id (seller)
 * - Creates: notification for seller
 * - Contributes to: seller's reputation score
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string; // Completed order being reviewed
  revieweeId: string; // Seller receiving review
  sellerName: string; // Display name for personalization
}

export const ReviewDialog = ({
  open,
  onOpenChange,
  orderId,
  revieweeId,
  sellerName,
}: ReviewDialogProps) => {
  // RATING STATE
  const [rating, setRating] = useState(0); // Selected rating (1-5)
  const [hoveredRating, setHoveredRating] = useState(0); // For hover preview
  const [comment, setComment] = useState(""); // Optional written feedback
  const [loading, setLoading] = useState(false); // Submission in progress
  const { toast } = useToast();

  /**
   * HANDLE SUBMIT
   * Creates review record and notifies seller
   * 
   * VALIDATION:
   * - Rating required (1-5 stars)
   * - Comment optional
   * - User must be authenticated
   * 
   * PROCESS:
   * 1. Validate rating selected
   * 2. Get authenticated user (reviewer/buyer)
   * 3. Insert review into reviews table
   * 4. Notify seller of new review
   * 5. Show success toast
   * 6. Close dialog and reset form
   * 
   * DATABASE OPERATIONS:
   * 
   * 1. INSERT INTO reviews:
   *    - order_id: Links review to specific transaction
   *    - reviewer_id: Buyer who left review
   *    - reviewee_id: Seller being reviewed
   *    - rating: 1-5 star rating (integer)
   *    - comment: Optional text feedback (max 500 chars)
   * 
   * 2. INSERT INTO notifications:
   *    - Alerts seller they received a review
   *    - Includes star rating in message
   *    - Links to order for context
   * 
   * REPUTATION IMPACT:
   * - Review contributes to seller's average rating
   * - Used in leaderboard calculations (rank_by_rating)
   * - Affects "Verified Seller" badge eligibility
   * - Visible to future buyers in marketplace
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATION: Rating is required
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Step 1: Get authenticated reviewer (buyer)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Step 2: Insert review into database
      const { error } = await supabase.from("reviews").insert({
        order_id: orderId, // Links to completed transaction
        reviewer_id: user.id, // Buyer leaving review
        reviewee_id: revieweeId, // Seller being reviewed
        rating, // 1-5 star rating
        comment: comment.trim() || null, // Optional feedback, null if empty
      });

      if (error) throw error;

      // Step 3: Notify seller about new review
      // Encourages sellers to check their reputation
      await supabase.from("notifications").insert({
        user_id: revieweeId,
        type: "social",
        title: "New Review",
        message: `You received a ${rating}-star review`,
        data: { order_id: orderId }, // Context for notification
      });

      // Step 4: Show success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Step 5: Close dialog and reset form
      onOpenChange(false);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience buying from {sellerName}?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating === 0 && "Select a rating"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Share your experience (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};