import { createHash, randomBytes } from 'crypto';

// Generate a short, human-readable password (6 characters alphanumeric)
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let password = '';
  const randomValues = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}

// Hash password with SHA-256 + salt
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

// Verify password against stored hash
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;

  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return hash === originalHash;
}
