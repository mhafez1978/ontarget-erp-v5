declare module "ethers" {
  // Minimal subset of types used by the code/tests

  export class Wallet {
    address: string;
    constructor(privateKey?: string);
  }

  export namespace utils {
    function isHexString(value: unknown, length?: number): boolean;
  }

  export function isAddress(address: string): boolean;

  export const providers: Record<string, unknown>;

  const _default: unknown;
  export default _default;
}
