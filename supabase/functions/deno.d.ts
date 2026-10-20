// The small part of Deno's runtime API the Edge Functions use, so `tsc -b` can typecheck
// index.ts files without the Deno toolchain. Add to it when a function needs more.
declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}
