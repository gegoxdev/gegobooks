import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { email, password } = await req.json();

  // Create auth user
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Insert into admin_users
  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ user_id: userData.user.id });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, user_id: userData.user.id }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
