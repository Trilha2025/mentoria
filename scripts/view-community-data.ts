
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({
        take: 10,
        select: { id: true, email: true, name: true, role: true }
    });
    console.table(users);

    console.log('\n--- COMMUNITY MEMBERS ---');
    const members = await prisma.communityMember.findMany({
        include: { user: { select: { email: true } } }
    });

    if (members.length === 0) {
        console.log('No community members found.');
    } else {
        console.table(members.map(m => ({ ...m, email: m.user.email })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
