import { sendPartnerInvite } from '../lib/sendPartnerInvite';
import prompts from 'prompts';

const partners = [
  { name: 'Queendom Collective', tokenSecret: 'QC-SECRET-001' },
  { name: 'Red Rollin Holdings', tokenSecret: 'RRH-SECRET-002' },
  { name: 'Limitech', tokenSecret: 'LIMITECH-PORTAL-ACCESS-GRANTED-003' },
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
  });

  console.log(`\n🚀 Generating invite for: ${partner.name}`);
  console.log(`📧 Partner email: ${partnerEmail}`);

  const tokenLink = `https://axpt.io/partner/verify?token=${partner.tokenSecret}`;

  const emailContent = await sendPartnerInvite({
    partnerName: partner.name,
    tokenSecret: partner.tokenSecret,
    tokenLink: tokenLink,
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