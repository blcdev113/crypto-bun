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
    const { email, type = 'signup' } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Store verification code in database
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to store verification code' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email with verification code
    const emailSubject = type === 'signup' ? 'Verify your email address' : 'Your login code'
    const emailBody = `
      <h2>${type === 'signup' ? 'Welcome to TX Exchange!' : 'Login to TX Exchange'}</h2>
      <p>Your verification code is:</p>
      <h1 style="font-size: 32px; font-weight: bold; color: #22C55E; text-align: center; letter-spacing: 8px; margin: 20px 0;">${code}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `

    // Send email using Supabase's email service
    const { error: emailError } = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TX Exchange <noreply@txexchange.com>',
        to: [email],
        subject: emailSubject,
        html: emailBody,
      }),
    }).then(res => res.json()).then(data => data.error || null)

    if (emailError) {
      console.error('Email sending error:', emailError)
      // Fallback: log the code for development
      console.log(`📧 Verification code for ${email}: ${code}`)
    } else {
      console.log(`✅ Email sent successfully to ${email}`)
    }

    // Always log the code in development for testing
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log(`🔑 DEV: Verification code for ${email}: ${code}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent successfully',
        // In development, return the code for testing
        ...(Deno.env.get('ENVIRONMENT') === 'development' && { code })
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

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