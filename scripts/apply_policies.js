const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPolicies() {
    console.log('⚖️ Setting up Storage Policies in Database...');
    
    try {
        // SQL for policies
        const sql = `
            -- Enable policies for 'community' bucket
            DO $$ 
            BEGIN
                -- Read Policy
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Community Public Access') THEN
                    CREATE POLICY "Community Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'community');
                END IF;

                -- Insert Policy (Authenticated)
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Community Upload Access') THEN
                    CREATE POLICY "Community Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community');
                END IF;

                -- Update Policy
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Community Update Access') THEN
                    CREATE POLICY "Community Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'community');
                END IF;
            END $$;
        `;

        await prisma.$executeRawUnsafe(sql);
        console.log('✅ Storage policies applied successfully!');
    } catch (error) {
        console.error('❌ Error applying policies:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runPolicies();
