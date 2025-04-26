import { sendPartnerInvite } from '../lib/sendPartnerInvite';
import prompts from 'prompts';

const partners = [
  { name: 'Queendom Collective', tokenSecret: process.env.NEXT_PUBLIC_QUEENDOM_COLLECTIVE_TOKEN! },
  { name: 'Red Rollin Holdings', tokenSecret: process.env.NEXT_PUBLIC_RED_ROLLIN_TOKEN! },
  { name: 'Limitech', tokenSecret: process.env.NEXT_PUBLIC_LIMITECH_TOKEN! },
];

(async () => {
  const { selectedPartner } = await prompts({
    type: 'select',
    name: 'selectedPartner',
    message: '💌 Which partner are you inviting today?',
    choices: partners.map((p, index) => ({ title: p.name, value: index })),
  });

  const partner = partners[selectedPartner];

  const { partnerEmail } = await prompts({
    type: 'text',
    name: 'partnerEmail',
    message: `📧 What's the email address for ${partner.name}?`,
    validate: email => email.includes('@') ? true : 'Please enter a valid email address.',
  });

  console.log(`\n🚀 Generating invite for: ${partner.name}`);
  console.log(`📧 Partner email: ${partnerEmail}`);

  const tokenLink = `https://axpt.io/partner/verify?token=${partner.tokenSecret}`;

  const emailContent = await sendPartnerInvite({
    partnerName: partner.name,
    tokenSecret: partner.tokenSecret,
    tokenLink,
  });

  const border = '============================================';

  console.log(`\n${border}`);
  console.log(`💌 Invite Email for: ${partner.name}`);
  console.log(`${border}\n`);
  console.log(emailContent);
  console.log(`\n${border}`);
  console.log(`✅ Email content ready. Copy and paste into Proton Mail.`);
  console.log(`${border}\n`);
})();