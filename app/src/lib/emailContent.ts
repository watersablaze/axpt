// lib/emailContent.ts

interface GenerateEmailBodyOptions {
    partnerName?: string;
    tokenLink: string;
    qrCodeBase64: string; // This is the base64 string from generateQRCode()
    tokenSecret: string;  // The 'password' they need to enter
  }
  
  export function generateEmailBody({
    partnerName = 'Partner',
    tokenLink,
    qrCodeBase64,
    tokenSecret
  }: GenerateEmailBodyOptions): string {
    return `
    Hello ${partnerName},
  
    You are invited to access the AXPT.io partner whitepaper.
  
    Click the link below to begin:
    🔗 ${tokenLink}
  
    You will be prompted to enter your key/password:
    🔒 ${tokenSecret}
  
    Or simply scan this QR code to open the link directly:
    <img src="${qrCodeBase64}" alt="QR Code" style="width:200px;height:200px;"/>
  
    This link is private and intended solely for your use.
    Please do not forward or share.
  
    With respect and anticipation,
    The AXPT.io Team
    `;
  }