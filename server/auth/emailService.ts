import crypto from "crypto";

export interface EmailConfig {
  from: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export async function sendAuthEmail(
  email: string,
  code: string,
  magicLinkToken: string,
  baseUrl: string
): Promise<boolean> {
  const magicLink = `${baseUrl}/auth/magic?token=${magicLinkToken}`;
  
  console.log("=== AUTH EMAIL (configure SMTP to send real emails) ===");
  console.log(`To: ${email}`);
  console.log(`Code: ${code}`);
  console.log(`Magic Link: ${magicLink}`);
  console.log("=========================================================");
  
  return true;
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
