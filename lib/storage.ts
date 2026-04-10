import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

export async function compressAndUploadImage(file: File, bucket: string = 'community') {
    // 1. Compression Options
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };

    try {
        // 2. Compress image
        const compressedFile = await imageCompression(file, options);
        
        // 3. Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 4. Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, compressedFile);

        if (error) throw error;

        // 5. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error in compressAndUploadImage:', error);
        throw error;
    }
}
