'use client';

import { StudentSidebar } from '@/components/Layout/StudentSidebar';
import { StudentHeader } from '@/components/Layout/StudentHeader';
import { StudentTopBar } from '@/components/Layout/StudentTopBar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background font-sans text-trenchy-text-primary flex transition-colors duration-300">
            {/* Sidebar Desktop */}
            <StudentSidebar />

            <div className="flex-1 md:ml-64 flex flex-col">
                {/* Header Mobile */}
                <div className="md:hidden">
                    <StudentHeader />
                </div>

                {/* TopBar Desktop */}
                <div className="hidden md:block">
                    <StudentTopBar />
                </div>

                {/* Main Content */}
                {children}
            </div>
        </div>
    );
}
