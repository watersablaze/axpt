import prompts from 'prompts';

async function verifyToken(token: string) {
  try {
    const res = await fetch('http://localhost:3000/api/partner/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`✅ Token "${token}" is valid for: ${data.partner}`);
    } else {
      console.error(`❌ Token "${token}" is invalid. Message: ${data.message}`);
    }
  } catch (error) {
    console.error(`❌ Error verifying token "${token}":`, error);
  }
}

// Auto-load partner tokens from .env
const partnerTokens: Record<string, string> = {
  'Queendom Collective': process.env.NEXT_PUBLIC_QUEENDOM_COLLECTIVE_TOKEN || '',
  'Red Rollin Holdings': process.env.NEXT_PUBLIC_RED_ROLLIN_TOKEN || '',
  'Limitech': process.env.NEXT_PUBLIC_LIMITECH_TOKEN || '',
  'AXPT Admin Access': process.env.NEXT_PUBLIC_AXPT_ADMIN_TOKEN || '',
};

(async () => {
  // Filter out any missing or empty .env tokens
  const availablePartners = Object.entries(partnerTokens).filter(([_, token]) => token);

  if (availablePartners.length === 0) {
    console.error('❌ No partner tokens found. Check your .env file!');
    process.exit(1);
  }

  const { selectedPartner } = await prompts({
    type: 'select',
    name: 'selectedPartner',
    message: '🔎 Which partner token would you like to verify?',
    choices: availablePartners.map(([name], index) => ({
      title: name,
      value: index,
    })),
  });

  const [partnerName, token] = availablePartners[selectedPartner];

  console.log(`\n🚀 Verifying token for: ${partnerName}`);
  await verifyToken(token);
})();