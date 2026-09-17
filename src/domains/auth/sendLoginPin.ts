import { resend } from '@/infrastructure/email/client'

type SendLoginPinInput = {
  email: string
  pin: string
  expiresInMinutes: number
}

function getSender() {
  return (
    process.env.AUTH_EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    'AXPT <connect@axpt.io>'
  )
}

export async function sendLoginPin({
  email,
  pin,
  expiresInMinutes,
}: SendLoginPinInput) {
  const subject = 'AXPT operator access code'

  const text = [
    'AXPT Operator Access',
    '',
    `Your access code is: ${pin}`,
    '',
    `This code expires in ${expiresInMinutes} minutes.`,
    '',
    'If you did not request access, no action is required.',
  ].join('\n')

  const html = `
    <div
      style="
        background:#07151c;
        color:#ebe7dd;
        font-family:Arial,Helvetica,sans-serif;
        padding:40px 28px;
      "
    >
      <div style="max-width:520px;margin:0 auto;">
        <p
          style="
            margin:0 0 28px;
            color:#b99657;
            font-size:11px;
            letter-spacing:.18em;
            text-transform:uppercase;
          "
        >
          AXPT / Operator Access
        </p>

        <h1
          style="
            margin:0 0 18px;
            font-size:24px;
            font-weight:500;
          "
        >
          Verification code
        </h1>

        <p
          style="
            margin:0 0 26px;
            color:#aaa69d;
            font-size:14px;
            line-height:1.6;
          "
        >
          Use the following one-time code to establish
          your AXPT operator session.
        </p>

        <div
          style="
            border-top:1px solid #41515a;
            border-bottom:1px solid #41515a;
            padding:22px 0;
            margin-bottom:24px;
            font-family:monospace;
            font-size:32px;
            letter-spacing:.22em;
            color:#f0ece2;
          "
        >
          ${pin}
        </div>

        <p
          style="
            margin:0;
            color:#777d7e;
            font-size:12px;
            line-height:1.6;
          "
        >
          This code expires in ${expiresInMinutes} minutes.
          If you did not request access, no action is required.
        </p>
      </div>
    </div>
  `

  const response = await resend.emails.send({
    from: getSender(),
    to: email,
    subject,
    html,
    text,
  })

  if (response.error) {
    throw new Error(
      `AUTH_PIN_EMAIL_FAILED:${response.error.message}`
    )
  }

  return response
}
