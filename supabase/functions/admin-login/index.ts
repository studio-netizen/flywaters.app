import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, password } = await req.json();
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    if (!adminEmail || !adminPassword) {
      return new Response(JSON.stringify({ error: "Admin non configurato" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const user_agent = req.headers.get("user-agent")?.slice(0, 500) || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminDb =
      supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

    const writeAudit = async (action: string, ok: boolean) => {
      if (!adminDb) return;
      try {
        await adminDb.from("audit_logs").insert({
          actor_email: email ?? null,
          actor_role: "admin",
          action,
          resource_type: "admin_session",
          details: { ok },
          ip_address,
          user_agent,
        });
      } catch {/* ignore */}
    };

    if (email !== adminEmail || password !== adminPassword) {
      await writeAudit("admin.login_failed", false);
      return new Response(JSON.stringify({ error: "Credenziali non valide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exp = Date.now() + 24 * 60 * 60 * 1000;
    const payloadB64 = btoa(JSON.stringify({ admin: true, exp }));
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(adminPassword),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

    await writeAudit("admin.login", true);

    return new Response(JSON.stringify({ token: `${payloadB64}.${sigB64}`, exp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
