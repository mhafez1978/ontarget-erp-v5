declare module "ethers" {
  // Minimal subset of types used by the code/tests

  export class Wallet {
    address: string;
    constructor(privateKey?: string);
  }

  export namespace utils {
    function isHexString(value: any, length?: number): boolean;
  }

  export function isAddress(address: string): boolean;

  export const providers: any;

  const _default: any;
  export default _default;
}
