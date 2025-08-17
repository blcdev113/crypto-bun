import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nbtdsnmjpqwtfmxhuyaw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5idGRzbm1qcHF3dGZteGh1eWF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTA2NTksImV4cCI6MjA3MDQ4NjY1OX0.Kq_fusTyJBrTv4QOJXC3ugVcz2Iv36TTHfv8UYeY3MU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Step 1: Send OTP to email
export async function sendOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) console.error("Error sending OTP:", error.message);
  else console.log("✅ OTP sent to email!");
}

// Step 2: Verify OTP
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) console.error("❌ Invalid OTP:", error.message);
  else console.log("✅ Logged in!", data);
}