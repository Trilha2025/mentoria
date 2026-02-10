'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserData {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    avatarUrl?: string;
}

interface UserContextType {
    user: UserData | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    refreshUser: async () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                const { data: profile } = await supabase
                    .from('User')
                    .select('id, name, email, role, avatarUrl')
                    .eq('id', authUser.id)
                    .single();

                if (profile) {
                    setUser({ ...authUser, ...profile });
                } else {
                    setUser(authUser as any);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();

        // Optional: Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUser();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const refreshUser = async () => {
        await fetchUser();
    };

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
