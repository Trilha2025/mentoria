
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'samuel@atrilhadoecommerce.com.br';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`User ${email} not found!`);
        return;
    }

    console.log(`Found user: ${user.name} (${user.id})`);

    const member = await prisma.communityMember.upsert({
        where: { userId: user.id },
        update: { role: 'ADMIN' },
        create: {
            userId: user.id,
            role: 'ADMIN',
            bio: 'Community Administrator'
        }
    });

    console.log('✅ Community Admin seeded successfully:');
    console.table(member);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
