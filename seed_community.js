const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Community Database...');

    // 1. Create Groups
    const group1 = await prisma.spaceGroup.create({
        data: {
            name: 'Comece Aqui',
            slug: 'start-here',
            emoji: '👋',
            order: 1
        }
    });

    const group2 = await prisma.spaceGroup.create({
        data: {
            name: 'Geral',
            slug: 'general',
            emoji: '💬',
            order: 2
        }
    });

    const group3 = await prisma.spaceGroup.create({
        data: {
            name: 'Suporte & Ajuda',
            slug: 'support-help',
            emoji: '🆘',
            order: 3
        }
    });

    // 2. Create Spaces
    await prisma.space.create({
        data: {
            name: 'Avisos',
            slug: 'announcements',
            description: 'Novidades e atualizações da plataforma.',
            emoji: '📢',
            type: 'POST',
            groupId: group1.id
        }
    });

    await prisma.space.create({
        data: {
            name: 'Apresente-se',
            slug: 'introductions',
            description: 'Diga olá para a comunidade!',
            emoji: '🤝',
            type: 'POST',
            groupId: group1.id
        }
    });

    await prisma.space.create({
        data: {
            name: 'Bate-papo',
            slug: 'general-chat',
            description: 'Conversas aleatórias e networking.',
            emoji: '☕',
            type: 'CHAT',
            groupId: group2.id
        }
    });

    await prisma.space.create({
        data: {
            name: 'Dúvidas Técnicas',
            slug: 'technical-questions',
            description: 'Ajuda com a plataforma.',
            emoji: '🔧',
            type: 'POST',
            groupId: group3.id
        }
    });

    await prisma.space.create({
        data: {
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
