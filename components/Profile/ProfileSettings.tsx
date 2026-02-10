'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCircleIcon, CameraIcon, CheckCircleIcon, XCircleIcon, KeyIcon, UserIcon, EyeIcon, EyeSlashIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/components/Providers/UserProvider';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/canvasUtils';

export const ProfileSettings = () => {
    const { user, loading, refreshUser } = useUser();
    const [saving, setSaving] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Zoom State
    const [isZoomed, setIsZoomed] = useState(false);

    // Crop State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setAvatarUrl(user.avatarUrl || null);
        }
    }, [user]);

    const fetchProfile = async () => {
        await refreshUser();
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('File input changed', e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            console.log('Selected file:', file);
            try {
                const imageDataUrl = await readFile(file);
                console.log('Image data URL loaded');
                setImageSrc(imageDataUrl);
                setIsCropping(true);
            } catch (err) {
                console.error('Error reading file:', err);
            }
        }
    };

    const readFile = (file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string), false);
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const uploadCroppedImage = async () => {
        try {
            setUploading(true);
            if (!imageSrc || !croppedAreaPixels) return;

            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error('Could not crop image');

            const fileName = `${Math.random()}.jpg`;
            const filePath = `${fileName}`;

            const file = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // Auto-save avatar URL
            await updateProfile(name, data.publicUrl);
            await refreshUser();

            setIsCropping(false);
            setImageSrc(null);

        } catch (error: any) {
            alert('Error uploading avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const updateProfile = async (newName: string, newAvatarUrl: string | null) => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, avatarUrl: newAvatarUrl })
            });
            const data = await res.json();
            if (data.success) {
                // Success feedback handled by UI state mostly
                await refreshUser();
            } else {
                alert('Erro ao atualizar perfil: ' + data.error);
            }
        } catch (error) {
            alert('Erro de conexão.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile(name, avatarUrl);
        alert('Perfil atualizado com sucesso!');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('As novas senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        try {
            const res = await fetch('/api/profile/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();

            if (data.success) {
                setPasswordSuccess('Senha alterada com sucesso!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordError(data.error || 'Erro ao alterar senha.');
            }
        } catch (error) {
            setPasswordError('Erro de conexão.');
        }
    };

    if (loading) return <div className="text-center py-10 text-trenchy-text-secondary">Carregando perfil...</div>;

    if (!user) {
        return (
            <div className="text-center py-10 text-trenchy-text-secondary">
                <p>Erro ao carregar perfil. Por favor, tente novamente.</p>
                <button
                    onClick={fetchProfile}
                    className="mt-4 px-4 py-2 bg-trenchy-orange text-white rounded-lg text-sm font-bold"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-full space-y-8">
            {/* Header Section */}
            <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                    <div
                        className="h-24 w-24 rounded-full overflow-hidden border-4 border-trenchy-card shadow-lg cursor-pointer relative"
                        onClick={() => avatarUrl && setIsZoomed(true)}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                                <UserCircleIcon className="h-16 w-16 text-gray-400" />
                            </div>
                        )}
                        {/* Zoom Overlay */}
                        {avatarUrl && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <MagnifyingGlassPlusIcon className="h-6 w-6 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <label className="absolute bottom-0 right-0 p-2 bg-trenchy-orange text-white rounded-full cursor-pointer hover:bg-orange-600 transition shadow-md" title="Alterar foto">
                        {uploading ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <CameraIcon className="h-4 w-4" />
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={uploading} />
                    </label>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-trenchy-text-primary">{user.name || 'Usuário'}</h1>
                    <p className="text-trenchy-text-secondary">{user.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold bg-black/5 dark:bg-white/5 text-gray-500 uppercase">
                        {user.role}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info Card */}
                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-trenchy-border pb-4">
                        <UserIcon className="h-5 w-5 text-trenchy-orange" />
                        <h2 className="text-lg font-bold text-trenchy-text-primary">Dados Pessoais</h2>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase">E-mail (Não editável)</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full p-3 bg-black/5 dark:bg-white/5 border border-transparent rounded-lg text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="pt-4 text-right">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-trenchy-text-primary text-background px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Card */}
                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-trenchy-border pb-4">
                        <KeyIcon className="h-5 w-5 text-trenchy-orange" />
                        <h2 className="text-lg font-bold text-trenchy-text-primary">Segurança</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase">Senha Atual</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Digite sua senha atual para confirmar"
                                    className="w-full p-3 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none transition pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase">Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full p-3 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                className="w-full p-3 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none transition"
                                required
                            />
                        </div>

                        {passwordError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-center gap-2">
                                <XCircleIcon className="h-5 w-5" />
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5" />
                                {passwordSuccess}
                            </div>
                        )}

                        <div className="pt-4 text-right">
                            <button
                                type="submit"
                                className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition shadow-lg shadow-red-900/20"
                            >
                                Alterar Senha
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Zoom Modal */}
            {isZoomed && avatarUrl && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setIsZoomed(false)}
                >
                    <img
                        src={avatarUrl}
                        alt="Avatar Zoom"
                        className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl border-2 border-white/20"
                    />
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                        <XCircleIcon className="h-10 w-10" />
                    </button>
                </div>
            )}

            {/* Crop Modal */}
            {isCropping && imageSrc && (
                <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-xl h-[400px] bg-black rounded-xl overflow-hidden mb-8">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="w-full max-w-xl space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="text-white text-sm font-medium">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                onClick={() => {
                                    setIsCropping(false);
                                    setImageSrc(null);
                                }}
                                className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={uploadCroppedImage}
                                disabled={uploading}
                                className="px-6 py-2 bg-trenchy-orange text-white rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
                            >
                                {uploading ? 'Salvando...' : 'Salvar Foto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
