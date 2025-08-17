import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code, password, type = 'signup' } = await req.json()

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the code
    const { data: verificationData, error: verifyError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verifyError || !verificationData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id)

    // Handle signup vs login
    if (type === 'signup' && password) {
      // Create new user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Skip email confirmation since we already verified
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account created successfully',
          user: authData.user
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // For login, create a session
      const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${req.headers.get('origin')}/auth/callback`
        }
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Login successful',
          session_url: authData.properties?.action_link
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})