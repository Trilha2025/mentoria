import { PrismaClient } from '@prisma/client';
// Force reload after schema update: v2

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Detect if the client is stale (missing new models or fields)
const checkStale = () => {
    if (!globalForPrisma.prisma) return false;
    const p = globalForPrisma.prisma as any;

    const missingUserAccess = !('userLessonAccess' in p);
    const missingLessonNote = !('lessonNote' in p);
    const missingEventGallery = !('eventGalleryImage' in p);
    const missingFavorite = !('favorite' in p);
    const missingCommentLike = !('commentLike' in p);

    if (missingUserAccess || missingLessonNote || missingEventGallery || missingFavorite || missingCommentLike) {
        console.log('🔄 [Prisma] Cliente desatualizado detectado:', {
            missingUserAccess,
            missingLessonNote,
            missingEventGallery,
            missingFavorite,
            missingCommentLike
        });
        return true;
    }
    return false;
};

if (checkStale()) {
    console.log('⚠️ [Prisma] Cliente desatualizado detectado (aula/tarefa). Forçando recarregamento...');
    (globalForPrisma.prisma as any).$disconnect?.();
    delete globalForPrisma.prisma;
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
