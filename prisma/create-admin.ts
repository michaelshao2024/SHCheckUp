import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@sanensheng.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.ADMIN_NAME || 'Site Admin';

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', passwordHash: hashPassword(password), name },
    create: { email, name, role: 'admin', passwordHash: hashPassword(password) },
  });

  console.log(`✅ Admin account ready: ${user.email} (role=${user.role})`);
  console.log('   Password was set from ADMIN_PASSWORD env (default: Admin123!) — change it after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
