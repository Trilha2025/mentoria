import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testing Prisma connection and schema...");
    try {
        const users = await prisma.user.findMany({
            take: 1,
            select: {
                id: true,
                email: true,
                // @ts-ignore
                avatarUrl: true
            }
        });
        console.log("Found user:", users[0]);
        console.log("SUCCESS: Prisma sees avatarUrl");
    } catch (e: any) {
        console.error("FAILURE: Prisma does NOT see avatarUrl or DB error:");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
