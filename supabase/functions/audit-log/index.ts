import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Whitelist of actions clients are allowed to log. Admin-only actions are
// written server-side from admin-api / admin-login and are not in this list.
const ALLOWED_ACTIONS = new Set([
  "user.registered",
  "user.login",
  "user.login_failed",
  "user.password_reset",
  "user.deleted",
  "post.created",
  "post.deleted",
  "spot.created",
  "spot.deleted",
  "review.created",
  "review.deleted",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({} as any));
    const {
      action,
      resource_type,
      resource_id,
      details,
    } = body as {
      action?: string;
      resource_type?: string;
      resource_id?: string;
      details?: Record<string, unknown>;
    };

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resource_type || typeof resource_type !== "string") {
      return new Response(JSON.stringify({ error: "resource_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Require a valid Supabase JWT — actor is ALWAYS derived from the verified
    // token, never from client-supplied body fields. This prevents log poisoning.
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = auth.slice(7);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const actor_id: string = userData.user.id;
    const actor_email: string | null = userData.user.email ?? null;


    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;
    const user_agent = req.headers.get("user-agent")?.slice(0, 500) || null;

    const { error } = await admin.from("audit_logs").insert({
      actor_id,
      actor_email,
      actor_role: "user",
      action,
      resource_type: resource_type.slice(0, 64),
      resource_id: resource_id ? String(resource_id).slice(0, 128) : null,
      details: details ?? null,
      ip_address,
      user_agent,
    });

    if (error) {
      console.error("audit-log insert error:", error.message);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("audit-log error:", (e as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
