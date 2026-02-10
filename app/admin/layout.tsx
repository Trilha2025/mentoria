'use client';
import { AdminHeader } from '@/components/Layout/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background font-sans text-trenchy-text-primary transition-colors duration-300">
            <AdminHeader />
            {children}
        </div>
    );
}
