
-- Update the user profile to be a super_admin
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'harshalgandhi12@gmail.com';

-- If the user doesn't exist in profiles yet but exists in auth.users
-- This will create a profile for them with super_admin role
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'super_admin' as role
FROM auth.users
WHERE email = 'harshalgandhi12@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'harshalgandhi12@gmail.com'
);
