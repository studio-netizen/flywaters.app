import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";
import { verifyAdminSession } from "../_shared/admin-session.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED_FOLDERS = new Set(["posts", "avatars", "spots", "blog", "reports", "reviews"]);

// Only image uploads are ever expected from the app.
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// Hard cap for signed uploads (bytes). Client compresses well below this.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;


function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const endpoint = Deno.env.get("R2_ENDPOINT");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucket = Deno.env.get("R2_BUCKET_NAME");
    const publicBaseRaw = Deno.env.get("R2_PUBLIC_URL");

    console.log("R2 env presence:", {
      endpoint: !!endpoint,
      accessKeyId: !!accessKeyId,
      secretAccessKey: !!secretAccessKey,
      bucket: !!bucket,
      publicBase: !!publicBaseRaw,
    });

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseRaw) {
      console.error("R2 misconfigured", {
        endpoint: !!endpoint,
        accessKeyId: !!accessKeyId,
        secretAccessKey: !!secretAccessKey,
        bucket: !!bucket,
        publicBase: !!publicBaseRaw,
      });
      return new Response(
        JSON.stringify({ error: "Storage service unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const publicBase = publicBaseRaw.replace(/\/$/, "");

    const body = await req.json();
    const folder = String(body.folder || "");
    const contentType = String(body.contentType || "application/octet-stream");
    const filename = body.filename ? sanitizeName(String(body.filename)) : "file";
    const upsertPath = body.path ? String(body.path) : null;
    const size = body.size;

    if (!ALLOWED_FOLDERS.has(folder)) {
      return new Response(JSON.stringify({ error: "Invalid folder" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType.toLowerCase())) {
      return new Response(JSON.stringify({ error: "Unsupported file type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof size !== "number" || !Number.isSafeInteger(size) || size <= 0) {
      return new Response(JSON.stringify({ error: "A positive integer file size is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (size > MAX_UPLOAD_BYTES) {
      return new Response(JSON.stringify({ error: "File too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: either user JWT or admin token
    let userId: string | null = null;
    let isAdmin = false;

    const adminToken = req.headers.get("x-admin-token");
    const adminDb = adminToken ? createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    ) : null;
    if (adminToken && adminDb && await verifyAdminSession(adminToken, adminDb)) {
      isAdmin = true;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabase.auth.getClaims(token);
      if (error || !data?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = data.claims.sub as string;
    }

    // Blog folder requires admin
    if (folder === "blog" && !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build key. Use userId in path for ownership verification on delete.
    let key: string;
    if (upsertPath) {
      // Caller-provided stable path (e.g. avatar). Must be within owner namespace.
      const ownerSeg = isAdmin ? "admin" : userId!;
      key = `${folder}/${ownerSeg}/${sanitizeName(upsertPath)}`;
    } else {
      const ownerSeg = isAdmin ? "admin" : userId!;
      const rand = crypto.randomUUID().slice(0, 8);
      key = `${folder}/${ownerSeg}/${Date.now()}-${rand}-${filename}`;
    }

    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    const baseUrl = `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
    const url = new URL(baseUrl);
    url.searchParams.set("X-Amz-Expires", "300");
    const signHeaders: Record<string, string> = { "content-type": contentType };
    // Binding the exact byte length into the signature prevents oversized uploads.
    signHeaders["content-length"] = String(size);
    const signed = await aws.sign(
      new Request(url.toString(), {
        method: "PUT",
        headers: signHeaders,
      }),
      { aws: { signQuery: true, allHeaders: true } },
    );

    return new Response(
      JSON.stringify({
        uploadUrl: signed.url,
        publicUrl: `${publicBase}/${key}`,
        key,
        contentType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("r2-sign-upload error:", String(e?.message || e));
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
