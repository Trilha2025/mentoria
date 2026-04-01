'use client';

import { ProfileSettings } from '@/components/Profile/ProfileSettings';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function CommunityProfilePage() {
    return (
        <main className="max-w-4xl mx-auto p-4 md:p-8 w-full min-h-screen">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold tracking-tight text-trenchy-text-primary flex items-center gap-3">
                    <UserCircleIcon className="h-8 w-8 text-trenchy-orange" />
                    Meu Perfil
                </h1>
                <p className="mt-2 text-trenchy-text-secondary">
                    Gerencie suas informações pessoais, foto e segurança da conta na comunidade.
                </p>
            </div>

            <div className="bg-trenchy-card border border-trenchy-border rounded-3xl p-2 md:p-8 shadow-xl">
                <ProfileSettings />
            </div>
        </main>
    );
}
