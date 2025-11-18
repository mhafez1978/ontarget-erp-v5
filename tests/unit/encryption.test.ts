import { expect } from "chai";
import {
  encrypt,
  decrypt,
  hash,
  maskSensitiveData,
  verifyWebhookSignature,
  generateWebhookSignature,
} from "@/lib/encryption";

describe("encryption utils", () => {
  it("encrypt/decrypt roundtrip", () => {
    const plain = "s3cret-P@ssw0rd";
    const enc = encrypt(plain);
    expect(enc).to.be.a("string").and.to.include(":");
    const dec = decrypt(enc);
    expect(dec).to.equal(plain);
  });

  it("handles empty input gracefully", () => {
    expect(encrypt("")).to.equal("");
    expect(decrypt("")).to.equal("");
  });

  it("hash is deterministic and not equal to input", () => {
    const plain = "abc";
    const h1 = hash(plain);
    const h2 = hash(plain);
    expect(h1).to.equal(h2);
    expect(h1).to.not.equal(plain);
    expect(h1).to.have.length(64);
  });

  it("masks sensitive data keeping last N chars", () => {
    expect(maskSensitiveData("1234567890", 4)).to.equal("******7890");
    expect(maskSensitiveData("abcd", 4)).to.equal("abcd");
  });

  it("verifies webhook signatures", () => {
    const payload = JSON.stringify({ ok: true });
    const secret = "topsecret";
    const sig = generateWebhookSignature(payload, secret);
    expect(verifyWebhookSignature(payload, sig, secret)).to.equal(true);
    expect(verifyWebhookSignature(payload, sig + "x", secret)).to.equal(false);
  });
});
