import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function handler() {
  let serve: (request: Request) => Promise<Response>;
  let signedHeaders: Headers | undefined;
  let options: any;
  const source = readFileSync('supabase/functions/r2-sign-upload/index.ts', 'utf8')
    .replace(/^import .*;\n/gm, '');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const Deno = {
    env: { get: () => 'test-value' },
    serve: (fn: typeof serve) => { serve = fn; },
  };
  const createClient = () => ({ auth: { getClaims: async () => ({ data: { claims: { sub: 'test-user' } } }) } });
  class AwsClient {
    async sign(request: Request, opts: any) {
      signedHeaders = request.headers;
      options = opts;
      return { url: 'https://storage.invalid/test' };
    }
  }
  // Use a syntactically valid endpoint while other mocked settings remain fake.
  Deno.env.get = () => 'https://storage.invalid';
  new Function('Deno', 'createClient', 'AwsClient', 'verifyAdminSession', js)(Deno, createClient, AwsClient, async () => false);
  return {
    request: (size: unknown, omit = false) => serve(new Request('https://app.invalid', {
      method: 'POST', headers: { Authorization: 'Bearer test-user', 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'posts', contentType: 'image/webp', ...(omit ? {} : { size }) }),
    })),
    signature: () => ({ signedHeaders, options }),
  };
}

describe('mandatory signed upload size', () => {
  it('rejects omitted, null, string, fractional and nonpositive sizes', async () => {
    const h = await handler();
    expect((await h.request(undefined, true)).status).toBe(400);
    for (const value of [null, '1024', 1.5, 0, -1]) {
      expect((await h.request(value)).status).toBe(400);
    }
    expect(h.signature().signedHeaders).toBeUndefined();
  });
  it('rejects files larger than 10 MB before signing', async () => {
    const h = await handler();
    expect((await h.request(10 * 1024 * 1024 + 1)).status).toBe(413);
    expect(h.signature().signedHeaders).toBeUndefined();
  });
  it('binds the exact accepted byte size and signs all headers', async () => {
    const h = await handler();
    expect((await h.request(1024)).status).toBe(200);
    expect(h.signature().signedHeaders?.get('content-length')).toBe('1024');
    expect(h.signature().options.aws.allHeaders).toBe(true);
  });
});