import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Detect if the client is stale (missing new models or fields)
const checkStale = () => {
    if (!globalForPrisma.prisma) return false;
    const p = globalForPrisma.prisma as any;

    const missingUserAccess = !('userLessonAccess' in p);
    const missingLessonNote = !('lessonNote' in p);
    const missingSubmissionLessonId = p.documentSubmission && !p.documentSubmission.fields?.lessonId;

    if (missingUserAccess || missingLessonNote || missingSubmissionLessonId) {
        console.log('🔄 [Prisma] Cliente desatualizado detectado:', {
            missingUserAccess,
            missingLessonNote,
            missingSubmissionLessonId
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
    new PrismaClient({
        log: ['query'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
