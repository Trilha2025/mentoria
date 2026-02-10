'use client';

import { ProfileSettings } from '@/components/Profile/ProfileSettings';

export default function StudentProfilePage() {
    return (
        <div className="w-full p-8">
            <h1 className="text-3xl font-bold text-trenchy-text-primary mb-2">Meu Perfil</h1>
            <p className="text-trenchy-text-secondary mb-8">Gerencie suas informações pessoais e segurança.</p>

            <ProfileSettings />
        </div>
    );
}
