import React from 'react';
import { render } from '@react-email/render';
import fs from 'fs';
import path from 'path';
import CadaWelcome from '../src/lib/email/templates/CadaWelcome';

const outputDir = path.join(process.cwd(), 'preview-output');
const outputPath = path.join(outputDir, 'cada-preview.html');

async function generateEmailPreview() {
  const html = await render(
    <CadaWelcome
      email="example@domain.com"
      joinedAtISO={new Date().toISOString()}
      heroImage="https://www.axpt.io/emails/assets/cada-bg-palms.png"
      logo="https://www.axpt.io/images/cada/cada-logo.png"
      primaryColor="#000000"
    />,
    { pretty: true }
  );

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  fs.writeFileSync(outputPath, html);
  console.log('✅ CADA email preview written to:', outputPath);
}

generateEmailPreview();