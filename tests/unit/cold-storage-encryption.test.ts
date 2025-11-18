import { expect } from "chai";
import {
  encryptBufferToString,
  decryptBufferFromString,
} from "@/lib/cold-storage-encryption";

function withTempKey<T>(keyHex: string, fn: () => T): T {
  const prev = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = keyHex;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = prev;
  }
}

describe("cold storage encryption (AES-256-GCM)", () => {
  const TEST_KEY =
    "a3f5d9c2e8b7f1a4d6c9e2b8f5a1c7d3e9b2f6a4c8d1e5b9f2a6c3d7e1b5f8a2"; // 64 hex

  it("round-trips a small buffer", () => {
    withTempKey(TEST_KEY, () => {
      const plain = Buffer.from("Hello cold storage! \u2600\ufe0f", "utf8");
      const enc = encryptBufferToString(plain);
      expect(enc).to.be.a("string");
      const dec = decryptBufferFromString(enc);
      expect(dec.equals(plain)).to.equal(true);
    });
  });

  it("produces different ciphertexts for same input (random IV)", () => {
    withTempKey(TEST_KEY, () => {
      const plain = Buffer.from("Same content");
      const e1 = encryptBufferToString(plain);
      const e2 = encryptBufferToString(plain);
      expect(e1).to.not.equal(e2);
      const d1 = decryptBufferFromString(e1);
      const d2 = decryptBufferFromString(e2);
      expect(d1.equals(plain)).to.equal(true);
      expect(d2.equals(plain)).to.equal(true);
    });
  });

  it("handles empty buffer as empty string", () => {
    withTempKey(TEST_KEY, () => {
      const enc = encryptBufferToString(Buffer.alloc(0));
      expect(enc).to.equal("");
      const dec = decryptBufferFromString(enc);
      expect(dec.length).to.equal(0);
    });
  });

  it("throws on invalid serialized format", () => {
    withTempKey(TEST_KEY, () => {
      expect(() => decryptBufferFromString("not-a-valid:payload")).to.throw(
        /Invalid encrypted data format/
      );
    });
  });
});
