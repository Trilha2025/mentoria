import { prisma } from "@/lib/prisma";
import AdminGalleryManager from "./GalleryManager";

export default async function AdminGalleryPage() {
    const images = await prisma.eventGalleryImage.findMany({
        orderBy: { order: 'asc' }
    });

    return <AdminGalleryManager images={images} />;
}
