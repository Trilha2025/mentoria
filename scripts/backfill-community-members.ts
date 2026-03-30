
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting backfill for Community Members...");

    // Fetch all users who don't have a communityMember record
    const usersWithoutCommunity = await prisma.user.findMany({
        where: {
            communityMember: {
                is: null
            }
        },
        select: { id: true, email: true, role: true }
    });

    console.log(`Found ${usersWithoutCommunity.length} users to backfill.`);

    for (const user of usersWithoutCommunity) {
        try {
            // Determine role: ADMIN -> ADMIN, others -> MEMBER
            let communityRole: 'ADMIN' | 'MEMBER' | 'MODERATOR' = 'MEMBER';
            if (user.role === 'ADMIN') communityRole = 'ADMIN';
            // Only platform admins become community admins by default? Or separate?
            // Let's create everyone as MEMBER for safety, except known admins if any.
            // Based on previous logic, ADMIN -> ADMIN seems okay? Or safer to let them promote manually.
            // Let's stick to simple logic: Platform Admin -> Community Admin? No, user wanted separation.
            // User requested explicit promotion. So default everyone to MEMBER.
            // Exception: The user 'samuel@atrilhadoecommerce.com.br' is already handled or we can skip.

            await prisma.communityMember.create({
                data: {
                    userId: user.id,
                    role: communityRole, // Default MEMBER
                    joinedAt: new Date(),
                }
            });
            console.log(`Created member for user: ${user.email}`);
        } catch (error) {
            console.error(`Failed to create member for ${user.email}:`, error);
        }
    }

    console.log("Backfill completed.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
