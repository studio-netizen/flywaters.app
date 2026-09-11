import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildWelcomeHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Benvenuto su Flywaters</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;">
<tr><td align="center" style="padding:30px 15px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- HEADER -->
<tr>
<td align="center" style="background-color:#242242;padding:30px 20px;border-radius:12px 12px 0 0;">
<img src="https://flywaters.app/placeholder.svg" alt="Flywaters" width="48" height="48" style="display:block;margin:0 auto 10px;" />
<span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">FLYWATERS</span>
</td>
</tr>

<!-- BODY -->
<tr>
<td style="background-color:#ffffff;padding:35px 30px;">

<h1 style="margin:0 0 20px;font-size:24px;color:#242242;line-height:1.3;">
Ciao ${name}, benvenuto nella community! 🎣
</h1>

<p style="margin:0 0 25px;font-size:15px;color:#555;line-height:1.6;">
Siamo felici di averti con noi. Flywaters è il posto dove i pescatori a mosca italiani si incontrano, condividono i loro spot preferiti e si aiutano a vicenda. Una community no-kill, fatta di passione vera.
</p>

<h2 style="margin:0 0 18px;font-size:18px;color:#242242;">Cosa puoi fare su Flywaters</h2>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
<tr>
<td style="padding:12px 15px;background-color:#f9f9f6;border-radius:8px;margin-bottom:10px;">
<span style="font-size:22px;">🗺️</span>
<strong style="color:#242242;font-size:14px;"> Esplora la mappa</strong>
<p style="margin:6px 0 0;font-size:13px;color:#666;line-height:1.5;">Scopri centinaia di spot recensiti dalla community: fiumi, torrenti e laghi di tutta Italia.</p>
</td>
</tr>
<tr><td style="height:8px;"></td></tr>
<tr>
<td style="padding:12px 15px;background-color:#f9f9f6;border-radius:8px;">
<span style="font-size:22px;">📸</span>
<strong style="color:#242242;font-size:14px;"> Condividi le tue uscite</strong>
<p style="margin:6px 0 0;font-size:13px;color:#666;line-height:1.5;">Pubblica foto delle tue catture, tagga lo spot e la tecnica usata.</p>
</td>
</tr>
<tr><td style="height:8px;"></td></tr>
<tr>
<td style="padding:12px 15px;background-color:#f9f9f6;border-radius:8px;">
<span style="font-size:22px;">💬</span>
<strong style="color:#242242;font-size:14px;"> Connettiti</strong>
<p style="margin:6px 0 0;font-size:13px;color:#666;line-height:1.5;">Segui altri pescatori, messaggia, scambia consigli sui montaggi e sulle schiuse.</p>
</td>
</tr>
</table>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:10px 0 25px;">
<a href="https://flywaters.app" target="_blank" style="display:inline-block;background-color:#242242;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:50px;">
Inizia ad esplorare →
</a>
</td>
</tr>
</table>

<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />

<h3 style="margin:0 0 10px;font-size:16px;color:#242242;">La nostra filosofia</h3>
<p style="margin:0;font-size:14px;color:#666;line-height:1.6;">
Su Flywaters crediamo nel no-kill. Ogni pesce rilasciato è una storia che continua. Grazie per condividere questi valori con noi.
</p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background-color:#242242;padding:25px 30px;border-radius:0 0 12px 12px;text-align:center;">
<p style="margin:0 0 12px;font-size:14px;color:#ffffff;font-style:italic;">
Lancia. Osserva. Rilascia. Rispetta.
</p>
<p style="margin:0 0 12px;font-size:12px;">
<a href="https://www.iubenda.com/privacy-policy/53958448" style="color:#aaaaaa;text-decoration:underline;">Privacy Policy</a>
&nbsp;|&nbsp;
<a href="https://www.iubenda.com/privacy-policy/53958448/cookie-policy" style="color:#aaaaaa;text-decoration:underline;">Cookie Policy</a>
&nbsp;|&nbsp;
<a href="https://flywaters.app/contatti" style="color:#aaaaaa;text-decoration:underline;">Contatti</a>
</p>
<p style="margin:0;font-size:11px;color:#888888;">
Hai ricevuto questa email perché ti sei registrato su flywaters.app
</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function sanitizeName(raw: string): string {
  // Strip HTML tags and encode dangerous characters to prevent HTML injection
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))
    .slice(0, 80);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require service-role authorization: this function is only callable from
  // trusted internal triggers (database webhooks / other edge functions).
  const authHeader = req.headers.get("authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!serviceKey || !authHeader.includes(serviceKey)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Email service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();

    // Support both webhook payload and direct call
    const userId = body.user_id || body.record?.user_id;
    const displayName = body.display_name || body.record?.display_name;
    const username = body.username || body.record?.username;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedupe: refuse if a welcome email was already successfully sent for this user.
    // This prevents abuse of the endpoint to spam users by replaying valid UUIDs.
    const { data: existing } = await supabase
      .from("welcome_emails")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "sent")
      .limit(1)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user?.email) {
      console.error("Could not get user email:", userError?.message);
      await supabase.from("welcome_emails").insert({
        user_id: userId,
        email: "unknown",
        status: "failed",
        error_message: userError?.message || "No email found",
      });
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawName = displayName || username || user.email.split("@")[0];
    const name = sanitizeName(String(rawName));
    const html = buildWelcomeHtml(name);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Flywaters <info@flywaters.app>",
        to: [user.email],
        subject: `Benvenuto su Flywaters, ${name}! 🎣`,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", JSON.stringify(resendData));
      await supabase.from("welcome_emails").insert({
        user_id: userId,
        email: user.email,
        status: "failed",
        error_message: JSON.stringify(resendData),
      });
      return new Response(JSON.stringify({ error: "Email send failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("welcome_emails").insert({
      user_id: userId,
      email: user.email,
      status: "sent",
    });

    console.log(`Welcome email sent to ${user.email}`);
    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
