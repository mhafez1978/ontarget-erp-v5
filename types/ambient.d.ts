// Ambient type declarations for optional dev-only modules

declare module "ts-command-line-args" {
  export function parse<T>(args?: any, options?: any): T;
}
