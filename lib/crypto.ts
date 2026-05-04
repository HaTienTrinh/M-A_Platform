// /lib/crypto.ts
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY;

export function encrypt(text: string): string {
  if (!KEY) {
    console.warn('ENCRYPTION_KEY not set, returning plain text (UNSAFE)');
    return text;
  }

  const iv = crypto.randomBytes(12);
  const keyBuffer = Buffer.from(KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encryptedContent
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string): string | null {
  if (!KEY) {
    console.warn('ENCRYPTION_KEY not set, returning plain text (UNSAFE)');
    return encryptedData;
  }

  try {
    const [ivHex, authTagHex, content] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !content) {
       // Support legacy non-prefixed if needed, but here we assume new format
       return encryptedData; 
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const keyBuffer = Buffer.from(KEY, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}
