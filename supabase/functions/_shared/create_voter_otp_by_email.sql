
CREATE OR REPLACE FUNCTION public.create_voter_otp_by_email(
  v_email TEXT,
  v_otp TEXT,
  v_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First invalidate any existing OTPs for this email
  UPDATE public.voter_otps
  SET used = true
  WHERE email = v_email AND used = false;
  
  -- Insert new OTP
  INSERT INTO public.voter_otps (
    email,
    otp,
    expires_at,
    used
  ) VALUES (
    v_email,
    v_otp,
    v_expires_at,
    false
  );
  
  RETURN true;
END;
$$;
