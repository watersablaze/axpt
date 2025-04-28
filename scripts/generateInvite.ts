import 'dotenv/config';
import crypto from 'crypto';
import readline from 'readline';

const secret = process.env.PARTNER_SECRET!;

function generateToken(partner: string) {
  return crypto.createHmac('sha256', secret).update(partner).digest('hex');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the partner string to generate invite for:\n', (partnerString) => {
  const token = generateToken(partnerString);

  const inviteMessage = `
------------------------------------------------------------
🎟️  AXPT.io Partner Portal Invitation
------------------------------------------------------------

Dear [Partner Name],

This invitation grants you access to the Axis Point Investments (AXPT.io) Partner Portal — 
the entryway to our whitepaper and the foundations of our upcoming phase of growth.

Your access token is individually created and intended for your sole use.
Please do not share this material outside of authorized channels.

Access Portal: https://axpt.io/partner/whitepaper?token=${token}
Token: ${token}

Welcome to the Axis.

— AXPT Team
------------------------------------------------------------
`;

  console.log(inviteMessage);
  rl.close();
});