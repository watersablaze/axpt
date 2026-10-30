import { Resend } from 'resend';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY_NOT_CONFIGURED');
  }

  return new Resend(apiKey);
}

export const resend = {
  get emails(): Resend['emails'] {
    return getResendClient().emails;
  },
};
