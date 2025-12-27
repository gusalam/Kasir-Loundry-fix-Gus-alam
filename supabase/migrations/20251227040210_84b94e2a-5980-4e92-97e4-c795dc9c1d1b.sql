-- Drop the old policy that allows any insert
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create new policy that allows users to insert notifications for themselves
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Also allow delete for cleanup
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());