const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Community Database...');

    // 1. Upsert Groups
    const group1 = await prisma.spaceGroup.upsert({
        where: { slug: 'start-here' },
        update: {},
        create: {
            name: 'Comece Aqui',
            slug: 'start-here',
            emoji: '👋',
            order: 1
        }
    });

    const group2 = await prisma.spaceGroup.upsert({
        where: { slug: 'general' },
        update: {},
        create: {
            name: 'Geral',
            slug: 'general',
            emoji: '💬',
            order: 2
        }
    });

    const group3 = await prisma.spaceGroup.upsert({
        where: { slug: 'support-help' },
        update: {},
        create: {
            name: 'Suporte & Ajuda',
            slug: 'support-help',
            emoji: '🆘',
            order: 3
        }
    });

    // 2. Upsert Spaces
    await prisma.space.upsert({
        where: { slug: 'announcements' },
        update: { groupId: group1.id },
        create: {
            name: 'Avisos',
            slug: 'announcements',
            description: 'Novidades e atualizações da plataforma.',
            emoji: '📢',
            type: 'POST',
            groupId: group1.id
        }
    });

    await prisma.space.upsert({
        where: { slug: 'introductions' },
        update: { groupId: group1.id },
        create: {
            name: 'Apresente-se',
            slug: 'introductions',
            description: 'Diga olá para a comunidade!',
            emoji: '🤝',
            type: 'POST',
            groupId: group1.id
        }
    });

    await prisma.space.upsert({
        where: { slug: 'general-chat' },
        update: { groupId: group2.id },
        create: {
            name: 'Bate-papo',
            slug: 'general-chat',
            description: 'Conversas aleatórias e networking.',
            emoji: '☕',
            type: 'CHAT',
            groupId: group2.id
        }
    });

    await prisma.space.upsert({
        where: { slug: 'technical-questions' },
        update: { groupId: group3.id },
        create: {
            name: 'Dúvidas Técnicas',
            slug: 'technical-questions',
            description: 'Ajuda com a plataforma.',
            emoji: '🔧',
            type: 'POST',
            groupId: group3.id
        }
    });

    await prisma.space.upsert({
        where: { slug: 'strategies' },
        update: { groupId: group2.id },
        create: {
            name: 'Estratégias',
            slug: 'strategies',
            description: 'Discussão sobre estratégias de venda.',
            emoji: '📈',
            type: 'POST',
            groupId: group2.id
        }
    });

    console.log('✅ Community Seeded Successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
