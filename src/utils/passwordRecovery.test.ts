/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPasswordRecoveryUrl,
  classifyRecoveryError,
  isPasswordRecoveryCallbackConfigured,
  isValidPin,
  isValidRecoveryEmail,
  normalizeRecoveryEmail,
  parsePasswordRecoveryUrl,
  recoveryErrorMessage,
  resolvePasswordRecoveryCallbackUrl,
} from './passwordRecovery';

const productionEnvironment = {
  VERCEL: '1',
  VERCEL_ENV: 'production',
  PIN_RECOVERY_SERVER_ENABLED: 'true',
};

const previewHost = 'masushi-preview.invalid';

const previewEnvironment = {
  VERCEL: '1',
  VERCEL_ENV: 'preview',
  VERCEL_URL: previewHost,
  PIN_RECOVERY_SERVER_ENABLED: 'true',
  PIN_RECOVERY_PREVIEW_URL: `https://${previewHost}/reset-password`,
  PIN_RECOVERY_PREVIEW_ALLOWED_HOST: previewHost,
};

test('production callback is fixed to the approved production recovery page', () => {
  assert.equal(
    resolvePasswordRecoveryCallbackUrl({
      ...productionEnvironment,
      PIN_RECOVERY_PREVIEW_URL: 'https://evil.vercel.app/reset-password',
    }),
    'https://www.masushi.cl/reset-password',
  );
});

test('preview callback requires the exact independent allowlisted deployment host', () => {
  assert.equal(
    resolvePasswordRecoveryCallbackUrl(previewEnvironment),
    previewEnvironment.PIN_RECOVERY_PREVIEW_URL,
  );
  assert.equal(isPasswordRecoveryCallbackConfigured(previewEnvironment), true);

  const withSpoofedHost = {
    ...previewEnvironment,
    host: 'evil.example',
    'x-forwarded-host': 'evil.example',
  };
  assert.equal(
    resolvePasswordRecoveryCallbackUrl(withSpoofedHost),
    previewEnvironment.PIN_RECOVERY_PREVIEW_URL,
  );
});

test('fails closed when Preview callback configuration is absent or points to production', () => {
  assert.throws(
    () => resolvePasswordRecoveryCallbackUrl({
      ...previewEnvironment,
      VERCEL: undefined,
    }),
    /not configured/,
  );
  assert.throws(
    () => resolvePasswordRecoveryCallbackUrl({
      ...previewEnvironment,
      PIN_RECOVERY_SERVER_ENABLED: 'false',
    }),
    /not configured/,
  );
  assert.throws(
    () => resolvePasswordRecoveryCallbackUrl({
      ...previewEnvironment,
      PIN_RECOVERY_PREVIEW_URL: undefined,
    }),
    /not configured/,
  );
  assert.throws(
    () => resolvePasswordRecoveryCallbackUrl({
      ...previewEnvironment,
      PIN_RECOVERY_PREVIEW_ALLOWED_HOST: undefined,
    }),
    /not configured/,
  );
  assert.throws(
    () => resolvePasswordRecoveryCallbackUrl({
      ...previewEnvironment,
      VERCEL_URL: undefined,
    }),
    /not configured/,
  );
  assert.throws(
    () => resolvePasswordRecoveryCallbackUrl({
      ...previewEnvironment,
      PIN_RECOVERY_PREVIEW_URL: 'https://www.masushi.cl/reset-password',
    }),
    /not configured/,
  );
  assert.throws(
    () => resolvePasswordRecoveryCallbackUrl({
      ...previewEnvironment,
      VERCEL_ENV: 'development',
    }),
    /not configured/,
  );
});

test('rejects third-party Vercel hosts, malicious subdomains, and deployment mismatches', () => {
  const invalidConfigurations = [
    {
      PIN_RECOVERY_PREVIEW_URL: 'https://other-project.vercel.app/reset-password',
    },
    {
      PIN_RECOVERY_PREVIEW_URL: `https://attacker.${previewHost}/reset-password`,
    },
    {
      PIN_RECOVERY_PREVIEW_URL: 'https://www.masushi.cl/reset-password',
    },
    {
      VERCEL_URL: 'deployment-specific.vercel.app',
    },
    {
      PIN_RECOVERY_PREVIEW_ALLOWED_HOST: 'other-project.vercel.app',
    },
    {
      PIN_RECOVERY_PREVIEW_ALLOWED_HOST: '*.masushi-preview.invalid',
    },
  ];

  for (const overrides of invalidConfigurations) {
    assert.throws(
      () => resolvePasswordRecoveryCallbackUrl({
        ...previewEnvironment,
        ...overrides,
      }),
      /not configured/,
    );
  }
});

test('rejects insecure, malformed, credentialed, or open-redirect callbacks', () => {
  const invalidUrls = [
    `http://${previewHost}/reset-password`,
    `https://${previewHost}/unexpected`,
    `https://${previewHost}/reset-password?next=https://evil.example`,
    `https://${previewHost}/reset-password#next=https://evil.example`,
    `https://user:pass@${previewHost}/reset-password`,
    `https://${previewHost}:444/reset-password`,
    'javascript:alert(1)',
  ];

  for (const url of invalidUrls) {
    assert.throws(
      () => resolvePasswordRecoveryCallbackUrl({
        ...previewEnvironment,
        PIN_RECOVERY_PREVIEW_URL: url,
      }),
      /not configured/,
    );
  }
});

test('builds a recovery link with an encoded token hash on the resolved callback', () => {
  const result = new URL(buildPasswordRecoveryUrl('hash+/=', productionEnvironment));

  assert.equal(result.origin, 'https://www.masushi.cl');
  assert.equal(result.pathname, '/reset-password');
  assert.equal(result.search, '');
  assert.deepEqual(
    Object.fromEntries(new URLSearchParams(result.hash.slice(1))),
    { token_hash: 'hash+/=', type: 'recovery' },
  );

  const previewResult = new URL(buildPasswordRecoveryUrl('test-hash', previewEnvironment));
  assert.equal(previewResult.origin, `https://${previewHost}`);
  assert.equal(previewResult.pathname, '/reset-password');
});

test('parses valid recovery hashes and rejects missing or mismatched tokens', () => {
  assert.deepEqual(
    parsePasswordRecoveryUrl(new URL('https://www.masushi.cl/reset-password#token_hash=abc&type=recovery')),
    { kind: 'token', tokenHash: 'abc' },
  );
  assert.deepEqual(
    parsePasswordRecoveryUrl(new URL('https://www.masushi.cl/reset-password#token_hash=abc&type=signup')),
    { kind: 'error', reason: 'invalid' },
  );
  assert.deepEqual(
    parsePasswordRecoveryUrl(new URL('https://www.masushi.cl/reset-password')),
    { kind: 'missing' },
  );
});

test('recognizes expired, used, and invalid recovery links from Supabase error parameters', () => {
  assert.deepEqual(
    parsePasswordRecoveryUrl(new URL('https://www.masushi.cl/reset-password?error_code=otp_expired')),
    { kind: 'error', reason: 'expired' },
  );
  assert.deepEqual(
    parsePasswordRecoveryUrl(new URL('https://www.masushi.cl/reset-password#error_description=Token%20already%20used')),
    { kind: 'error', reason: 'used' },
  );
  assert.equal(classifyRecoveryError('unknown error'), 'invalid');
  assert.equal(recoveryErrorMessage('expired'), 'El enlace expiró. Solicita uno nuevo.');
});

test('normalizes and validates recovery email without accepting malformed addresses', () => {
  assert.equal(normalizeRecoveryEmail('  User@Example.COM  '), 'user@example.com');
  assert.equal(isValidRecoveryEmail('user@example.com'), true);
  assert.equal(isValidRecoveryEmail('user@localhost'), false);
  assert.equal(isValidRecoveryEmail('not-an-email'), false);
});

test('accepts only exactly four numeric PIN digits', () => {
  assert.equal(isValidPin('0123'), true);
  assert.equal(isValidPin('123'), false);
  assert.equal(isValidPin('12345'), false);
  assert.equal(isValidPin('12a4'), false);
});
