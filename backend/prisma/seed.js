const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const seedAdmin = async () => {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@tmshospital.com').trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const adminName = process.env.SEED_ADMIN_NAME || 'System Administrator';
  const adminPhone = process.env.SEED_ADMIN_PHONE || '9999999999';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: adminName,
      phone: adminPhone,
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      fullName: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`Default admin user is ready: ${adminEmail}`);
};

seedAdmin()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
