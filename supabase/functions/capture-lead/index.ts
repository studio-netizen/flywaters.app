import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildGuideHtml(): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>La tua guida Flywaters</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;">
<tr><td align="center" style="padding:30px 15px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- HEADER -->
<tr>
<td align="center" style="background-color:#242242;padding:30px 20px;border-radius:12px 12px 0 0;">
<span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">FLYWATERS</span>
</td>
</tr>

<!-- BODY -->
<tr>
<td style="background-color:#ffffff;padding:35px 30px;">

<h1 style="margin:0 0 20px;font-size:24px;color:#242242;line-height:1.3;">
Ecco la tua guida ai migliori spot! 🎣
</h1>

<p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
Grazie per aver scaricato la guida Flywaters. Qui trovi una selezione dei migliori spot di pesca a mosca in Italia, con consigli pratici per ogni regione.
</p>

<h2 style="margin:0 0 15px;font-size:18px;color:#242242;">🗺️ Spot in evidenza</h2>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
<tr>
<td style="padding:12px 15px;background-color:#f9f9f6;border-radius:8px;margin-bottom:8px;">
<strong style="color:#242242;font-size:14px;">Torrente Sesia — Piemonte</strong>
<p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.5;">Trota marmorata e fario. Periodo: aprile-settembre. Mosche secche e ninfe.</p>
</td>
</tr>
<tr><td style="height:8px;"></td></tr>
<tr>
<td style="padding:12px 15px;background-color:#f9f9f6;border-radius:8px;">
<strong style="color:#242242;font-size:14px;">Fiume Brenta — Veneto</strong>
<p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.5;">Temolo e trota iridea. Acque di risorgiva cristalline. Ideale per dry fly.</p>
</td>
</tr>
<tr><td style="height:8px;"></td></tr>
<tr>
<td style="padding:12px 15px;background-color:#f9f9f6;border-radius:8px;">
<strong style="color:#242242;font-size:14px;">Torrente Nera — Umbria</strong>
<p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.5;">Trota fario in ambiente selvaggio. Schiuse importanti in primavera.</p>
</td>
</tr>
</table>

<h2 style="margin:0 0 15px;font-size:18px;color:#242242;">💡 Consigli rapidi</h2>
<ul style="margin:0 0 25px;padding-left:20px;font-size:14px;color:#555;line-height:1.8;">
<li>Controlla sempre le <strong>regolamentazioni locali</strong> prima di pescare</li>
<li>Usa il <strong>barbless hook</strong> per un rilascio sicuro</li>
<li>Le schiuse migliori sono nelle ore più fresche della giornata</li>
<li>Porta sempre un <strong>termometro per l'acqua</strong> — sopra i 20°C le trote soffrono</li>
</ul>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:10px 0 25px;">
<a href="https://flywaters.app/map" target="_blank" style="display:inline-block;background-color:#242242;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:50px;">
Esplora tutti gli spot sulla mappa →
</a>
</td>
</tr>
</table>

<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />

<p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
Vuoi accedere a centinaia di spot con coordinate GPS, foto e recensioni? <a href="https://flywaters.app/auth" style="color:#242242;font-weight:bold;">Registrati gratis su Flywaters</a> e unisciti alla community dei fly fisher italiani.
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
Hai ricevuto questa email perché hai richiesto la guida gratuita su flywaters.app
</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { email, source } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email.length > 255) {
      return new Response(JSON.stringify({ error: "Email too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedSource = typeof source === "string" ? source.slice(0, 100) : "landing";

    // Check if already exists in CRM
    const { data: existing } = await supabase
      .from("crm_contacts")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Already in CRM - don't duplicate, but still send guide
      console.log(`Lead already exists: ${email} (status: ${existing.status})`);
    } else {
      // Insert as lead (no user_id since not registered)
      const { error: insertError } = await supabase.from("crm_contacts").insert({
        email,
        source: sanitizedSource,
        status: "lead",
        user_id: "00000000-0000-0000-0000-000000000000", // placeholder for non-registered leads
      });

      if (insertError) {
        console.error("CRM insert error:", insertError);
        // Don't fail - still try to send email
      }
    }

    // Send guide email
    const html = buildGuideHtml();
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Flywaters <info@flywaters.app>",
        to: [email],
        subject: "La tua guida ai migliori spot di pesca a mosca 🎣",
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", JSON.stringify(resendData));
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Guide email sent to ${email}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", (e as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
