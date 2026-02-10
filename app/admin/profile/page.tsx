'use client';

import { ProfileSettings } from '@/components/Profile/ProfileSettings';

export default function AdminProfilePage() {
    return (
        <div className="w-full p-8">
            <h1 className="text-3xl font-bold text-trenchy-text-primary mb-2">Configurações da Conta</h1>
            <p className="text-trenchy-text-secondary mb-8">Gerencie seus dados de acesso.</p>

            <ProfileSettings />
        </div>
    );
}
