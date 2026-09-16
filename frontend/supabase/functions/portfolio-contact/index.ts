import { createContactHandler } from './handler.ts';

// Supabase's hosted Deno runtime provides these APIs.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

Deno.serve(createContactHandler(key => Deno.env.get(key)));
