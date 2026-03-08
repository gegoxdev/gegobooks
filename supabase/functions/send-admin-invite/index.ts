import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify caller is authenticated
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { email, role, siteUrl } = await req.json();

    // Create invite via RPC (handles authorization checks)
    const { data: token, error: inviteError } = await supabaseUser.rpc('create_admin_invite', {
      target_email: email,
      invite_role: role,
    });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: corsHeaders });
    }

    // Try to send email via Supabase's built-in email
    // Generate invite link
    const inviteLink = `${siteUrl}/admin?invite=${token}`;

    // Send email using admin API - create a magic link style notification
    // We'll use the admin API to send a custom email
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: inviteLink,
      }
    });

    // Even if email fails, the invite is created (in-app will work)
    const emailSent = !emailError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        token, 
        inviteLink,
        emailSent,
        message: emailSent 
          ? `Invite sent to ${email}` 
          : `Invite created. Share this link: ${inviteLink}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
