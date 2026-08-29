import { DeterministicEmailVerifier } from '../../src/services/email-verification.service.js';

describe('DeterministicEmailVerifier (Unit Tests)', () => {
  const verifier = new DeterministicEmailVerifier();

  it('should validate deliverable corporate email formats', async () => {
    const result = await verifier.verify('satya.nadella@microsoft-cloud.com');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('VALID');
    expect(result.domain).toBe('microsoft-cloud.com');
  });

  it('should reject malformed syntax emails', async () => {
    const result = await verifier.verify('invalid-email-without-at.com');
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('INVALID');
  });

  it('should reject disposable / temporary email provider domains', async () => {
    const result = await verifier.verify('testuser@trashmail.com');
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('INVALID');
    expect(result.isDisposable).toBe(true);
  });
});
