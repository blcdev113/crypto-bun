import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  email: string
  code: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code }: EmailRequest = await req.json()

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TX Exchange <noreply@txexchange.com>',
        to: [email],
        subject: 'Verify Your TX Exchange Account',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Account</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="color: #22C55E; margin-bottom: 10px;">TX Exchange</h1>
                <h2 style="color: white; margin-bottom: 30px;">Verify Your Account</h2>
                
                <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Thank you for registering with TX Exchange! Please use the verification code below to complete your account setup:
                  </p>
                  
                  <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #22C55E; font-size: 32px; font-family: monospace; letter-spacing: 8px; margin: 0;">
                      ${code}
                    </h3>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
                  </p>
                </div>
                
                <div style="margin-top: 30px;">
                  <p style="color: #94A3B8; font-size: 12px;">
                    © 2025 TX Exchange. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
TX Exchange - Verify Your Account

Thank you for registering with TX Exchange!

Your verification code is: ${code}

This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.

© 2025 TX Exchange. All rights reserved.
        `
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await emailResponse.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        emailId: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-verification-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})