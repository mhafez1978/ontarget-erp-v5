// Ambient type declarations for optional dev-only modules

declare module "ts-command-line-args" {
  export function parse<T>(
    args?: Record<string, unknown> | undefined,
    options?: Record<string, unknown> | undefined
  ): T;
}
