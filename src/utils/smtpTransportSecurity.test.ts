/* eslint-env node */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import * as nodemailer from 'nodemailer';
import { getSmtpTransportSecurityOptions } from './smtpTransportSecurity';

test('recovery SMTP on port 587 refuses plaintext fallback and validates the certificate', () => {
  assert.deepEqual(getSmtpTransportSecurityOptions(587, true), {
    secure: false,
    requireTLS: true,
    tls: { rejectUnauthorized: true },
  });
});

test('recovery SMTP on port 465 uses implicit TLS and validates the certificate', () => {
  assert.deepEqual(getSmtpTransportSecurityOptions(465, true), {
    secure: true,
    tls: { rejectUnauthorized: true },
  });
});

test('recovery SMTP rejects unsupported ports instead of allowing an insecure connection', () => {
  assert.throws(
    () => getSmtpTransportSecurityOptions(25, true),
    /requires SMTP port 465 or 587/,
  );
});

test('Nodemailer rejects an SMTP server that does not advertise STARTTLS', async () => {
  const sockets = new Set<import('node:net').Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8');
    socket.write('220 local.test ESMTP\r\n');
    let pending = '';
    socket.on('data', (chunk) => {
      pending += chunk;
      const lines = pending.split(/\r\n/);
      pending = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('EHLO ')) {
          socket.write('250-local.test\r\n250 SIZE 100000\r\n');
        } else if (line === 'STARTTLS') {
          socket.write('454 TLS is not available\r\n');
        } else if (line === 'QUIT') {
          socket.write('221 Bye\r\n');
        } else {
          socket.write('250 OK\r\n');
        }
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const transport = nodemailer.createTransport({
    host: '127.0.0.1',
    port: address.port,
    ...getSmtpTransportSecurityOptions(587, true),
  });

  try {
    await assert.rejects(
      transport.sendMail({
        from: 'test@example.invalid',
        to: 'test@example.invalid',
        subject: 'Local TLS test',
        text: 'No message should be delivered.',
      }),
      /STARTTLS|TLS|secure/i,
    );
  } finally {
    transport.close();
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test('other email flows retain their prior port-based transport behavior', () => {
  assert.deepEqual(getSmtpTransportSecurityOptions(587), { secure: false });
  assert.deepEqual(getSmtpTransportSecurityOptions(465), { secure: true });
});
