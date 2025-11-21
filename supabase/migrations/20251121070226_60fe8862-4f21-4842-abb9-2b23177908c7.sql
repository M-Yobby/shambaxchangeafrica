-- Update comment deletion policy to allow post owners to delete comments
-- Drop existing policy
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Create new policy allowing both comment authors and post owners to delete
CREATE POLICY "Users can delete their own comments or comments on their posts"
ON public.comments
FOR DELETE
USING (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT user_id FROM public.posts WHERE id = comments.post_id
  )
);