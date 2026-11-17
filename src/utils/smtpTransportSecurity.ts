export const getSmtpTransportSecurityOptions = (
  port: number,
  requireTransportEncryption = false,
) => {
  if (requireTransportEncryption && port !== 465 && port !== 587) {
    throw new Error('Recovery email requires SMTP port 465 or 587');
  }

  if (!requireTransportEncryption) {
    return {
      secure: port === 465,
    };
  }

  return {
    secure: port === 465,
    ...(port === 587 ? { requireTLS: true } : {}),
    tls: {
      rejectUnauthorized: true,
    },
  };
};
