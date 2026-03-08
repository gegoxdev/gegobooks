import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    // Get the payment reference and tier from the request
    const { reference, tier } = await req.json();
    if (!reference || !tier) {
      return new Response(JSON.stringify({ error: "Missing reference or tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["priority", "founder"].includes(tier)) {
      return new Response(JSON.stringify({ error: "Invalid tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: "Payment service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return new Response(JSON.stringify({ error: "Payment not verified", details: verifyData.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the amount matches the tier
    const amountInKobo = verifyData.data.amount; // Paystack returns amount in kobo
    const expectedAmounts: Record<string, number> = {
      priority: 150000, // ₦1,500 = 150,000 kobo
      founder: 1500000, // ₦15,000 = 1,500,000 kobo
    };

    if (amountInKobo < expectedAmounts[tier]) {
      return new Response(JSON.stringify({ error: "Payment amount does not match tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the email matches
    const paymentEmail = verifyData.data.customer?.email?.toLowerCase();
    if (paymentEmail && userEmail && paymentEmail !== userEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Payment email does not match account email' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to upgrade tier (bypasses RLS)
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for replay attack — ensure reference hasn't been used before
    const { error: refInsertError } = await adminSupabase
      .from("used_payment_references")
      .insert({ reference, user_id: userId, tier });

    if (refInsertError) {
      return new Response(JSON.stringify({ error: "Payment reference already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get current tier to prevent downgrades
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("tier")
      .eq("user_id", userId)
      .maybeSingle();

    const tierRank: Record<string, number> = { free: 0, priority: 1, founder: 2 };
    const currentRank = tierRank[profile?.tier || "free"] || 0;
    const newRank = tierRank[tier] || 0;

    if (newRank <= currentRank) {
      return new Response(JSON.stringify({ error: "Cannot downgrade tier", current_tier: profile?.tier }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upgrade the tier
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ tier })
      .eq("user_id", userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to upgrade tier" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, tier, message: `Upgraded to ${tier}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
