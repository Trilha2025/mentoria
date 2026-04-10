const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
    console.log('🚀 Setting up Supabase Storage...');

    // 1. Create Bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('community', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
    });

    if (bucketError) {
        if (bucketError.message.includes('already exists')) {
            console.log('ℹ️ Bucket "community" already exists.');
        } else {
            console.error('❌ Error creating bucket:', bucketError.message);
        }
    } else {
        console.log('✅ Bucket "community" created successfully!');
    }

    // 2. Create Policies via RPC/SQL is not directly possible via JS SDK in a simple way
    // but the bucket being public:true handles basic read.
    // For upload policies, we usually need SQL.
    
    console.log('📝 Note: Policies should be created via SQL if not already present.');
    console.log('✅ Storage setup script finished.');
}

setupStorage();
