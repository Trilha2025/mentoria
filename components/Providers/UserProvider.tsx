'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserData {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    avatarUrl?: string;
    accessType?: string;
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

// Global state to prevent concurrent fetch operations and loops
let globalIsFetching = false;
let lastFetchTime = 0;
let lastAuthErrorTime = 0;
let last429Time = 0;

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const initialized = useRef(false);
    const userRef = useRef<UserData | null>(null);

    // Sync ref with state for safe access in the async listener
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const forceLogout = async () => {
        const now = Date.now();
        // Even more aggressive loop protection for forceLogout
        if (now - lastAuthErrorTime < 8000) return; 
        lastAuthErrorTime = now;

        console.warn('[UserProvider] CRITICAL: Auth corruption detected. Clearing all storage.');
        
        try {
            await supabase.auth.signOut();
        } catch (e) {
            // Ignore signout errors
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
                
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login?error=session_timeout';
                }
            }
        }
    };

    const fetchUser = async (session: Session | null = null) => {
        const now = Date.now();
        
        if (globalIsFetching) return;

        const cooldown = (now - last429Time < 15000) ? 15000 : 1500;
        if (now - lastFetchTime < cooldown && !session) {
            if (loading) setLoading(false);
            return;
        }

        globalIsFetching = true;
        lastFetchTime = now;

        try {
            let authUser: User | null = session?.user || null;
            
            if (!authUser) {
                const { data, error: authError } = await supabase.auth.getUser();
                
                if (authError) {
                    const msg = authError.message?.toLowerCase() || '';
                    const status = authError.status;
                    
                    if (status === 429) {
                        last429Time = now;
                        return;
                    }

                    const isFatal = msg.includes('already used') || 
                                   msg.includes('refresh_token_not_found') ||
                                   msg.includes('invalid_grant') ||
                                   (status === 400 && authError.name !== 'AuthSessionMissingError');

                    if (isFatal) {
                        if (msg.includes('already used')) {
                            await new Promise(r => setTimeout(r, 1000));
                            const { data: retry } = await supabase.auth.getSession();
                            if (retry?.session) {
                                console.log('[UserProvider] Recovery successful.');
                                globalIsFetching = false;
                                await fetchUser(retry.session);
                                return;
                            }
                        }
                        
                        await forceLogout();
                        return;
                    }

                    if (
                        msg.includes('aborted') || 
                        authError.name === 'AbortError' ||
                        authError.name === 'AuthSessionMissingError' ||
                        status === 401
                    ) {
                        if (userRef.current !== null) setUser(null);
                        return;
                    }
                }
                authUser = data.user;
            }

            if (authUser) {
                const { data: profile, error: profileError } = await supabase
                    .from('User')
                    .select('id, name, email, role, avatarUrl, accessType')
                    .eq('id', authUser.id)
                    .single();

                if (!profileError && profile) {
                    setUser({ ...authUser, ...profile });
                } else {
                    setUser(authUser as any);
                }
            } else {
                if (userRef.current !== null) setUser(null);
            }
        } catch (error: any) {
            const msg = error.message?.toLowerCase() || '';
            if (msg.includes('already used') || msg.includes('refresh_token')) {
                await forceLogout();
            }
        } finally {
            setLoading(false);
            globalIsFetching = false;
        }
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        fetchUser();

        let lastEventTime = 0;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const now = Date.now();
            if (now - lastEventTime < 1000) return;
            lastEventTime = now;

            if (event === 'SIGNED_OUT') {
                if (userRef.current !== null) {
                    setUser(null);
                    setLoading(false);
                }
                return;
            }

            if (event === 'INITIAL_SESSION' && userRef.current !== null) return;

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                await fetchUser(session || undefined);
            }
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
