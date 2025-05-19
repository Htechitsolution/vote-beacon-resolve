
CREATE OR REPLACE FUNCTION public.verify_voter_otp_by_email(
  v_email TEXT,
  v_otp TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_valid BOOLEAN;
BEGIN
  UPDATE public.voter_otps
  SET used = TRUE
  WHERE email = v_email
    AND otp = v_otp
    AND NOT used
    AND expires_at > NOW()
  RETURNING TRUE INTO otp_valid;
  
  RETURN COALESCE(otp_valid, FALSE);
END;
$$;
