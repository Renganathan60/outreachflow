import { EmailVerificationStatus } from '../types/index.js';

export interface VerificationResult {
  status: EmailVerificationStatus;
  isValid: boolean;
  reason?: string;
  domain?: string;
  isDisposable?: boolean;
}

export interface IEmailVerificationProvider {
  verify(email: string): Promise<VerificationResult>;
}

/**
 * Deterministic Built-in Email Verifier
 */
export class DeterministicEmailVerifier implements IEmailVerificationProvider {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  private static readonly DISPOSABLE_DOMAINS = new Set([
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'trashmail.com',
    'yopmail.com',
    'sharklasers.com',
    'getairmail.com',
    'dispostable.com'
  ]);

  public async verify(email: string): Promise<VerificationResult> {
    if (!email || typeof email !== 'string') {
      return {
        status: 'INVALID',
        isValid: false,
        reason: 'Email string is empty or missing'
      };
    }

    const trimmed = email.trim().toLowerCase();

    // 1. Format check
    if (!DeterministicEmailVerifier.EMAIL_REGEX.test(trimmed)) {
      return {
        status: 'INVALID',
        isValid: false,
        reason: 'Invalid email syntax format'
      };
    }

    const parts = trimmed.split('@');
    if (parts.length !== 2) {
      return {
        status: 'INVALID',
        isValid: false,
        reason: 'Malformed email domain structure'
      };
    }

    const domain = parts[1];

    // 2. Domain length & dot check
    if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
      return {
        status: 'INVALID',
        isValid: false,
        reason: 'Invalid Top-Level Domain (TLD) structure'
      };
    }

    // 3. Disposable Domain Check
    if (DeterministicEmailVerifier.DISPOSABLE_DOMAINS.has(domain)) {
      return {
        status: 'INVALID',
        isValid: false,
        domain,
        isDisposable: true,
        reason: 'Disposable / temporary email domains are not allowed'
      };
    }

    return {
      status: 'VALID',
      isValid: true,
      domain,
      isDisposable: false,
      reason: 'Email syntax and domain format verified successfully'
    };
  }
}

export class EmailVerificationService {
  private provider: IEmailVerificationProvider;

  constructor(provider: IEmailVerificationProvider = new DeterministicEmailVerifier()) {
    this.provider = provider;
  }

  public async verifyEmail(email: string): Promise<VerificationResult> {
    return this.provider.verify(email);
  }
}

export const emailVerificationService = new EmailVerificationService();
