-- Add INSERT policy to public.users to allow client-side registration inserts
CREATE POLICY "users_insert_own" ON public.users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- We might also need to drop the handle_new_user trigger if it conflicts and we are doing manual inserts.
-- But if the trigger exists and fails, we should drop it. If it doesn't fail, it might create a duplicate key error
-- when the client-side insert runs. So it's best to drop the trigger to prevent duplicate key violations,
-- since we are now handling inserts manually in code.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
