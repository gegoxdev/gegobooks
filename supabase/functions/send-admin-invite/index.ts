import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing env vars: SUPABASE_URL or SUPABASE_ANON_KEY");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    let email = "";
    let role = "";
    let siteUrl = "";
    try {
      const body = await req.json();
      email = body?.email?.trim?.() ?? "";
      role = body?.role ?? "";
      siteUrl = body?.siteUrl?.trim?.() ?? "";
    } catch {
      return jsonResponse({ error: "Invalid request body" }, 400);
    }

    if (!email || !role || !siteUrl) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const allowedRoles = new Set(["readonly", "approver", "admin", "master"]);
    if (!allowedRoles.has(role)) {
      return jsonResponse({ error: "Invalid role" }, 400);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("JWT validation failed", claimsError);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: inviteToken, error: inviteError } = await supabaseUser.rpc("create_admin_invite", {
      target_email: email,
      invite_role: role,
    });

    if (inviteError) {
      console.error("create_admin_invite failed", inviteError);
      return jsonResponse({ error: inviteError.message }, 400);
    }

    const normalizedSite = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
    const inviteLink = `${normalizedSite}/admin?invite=${inviteToken}`;

    return jsonResponse({
      success: true,
      token: inviteToken,
      inviteLink,
      emailSent: false,
      message: "Invite created! Share this link with the recipient.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("send-admin-invite error", err);
    return jsonResponse({ error: message }, 500);
  }
});
