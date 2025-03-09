'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NostrContextType {
  npub: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: () => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
  hasExtension: boolean;
  profile: {
    name: string;
    picture?: string;
  } | null;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

export function NostrProvider({ children }: { children: React.ReactNode }) {
  const [npub, setNpub] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [hasExtension, setHasExtension] = useState(false);
  const [profile, setProfile] = useState<NostrContextType['profile']>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if window.nostr is available
    if (typeof window !== 'undefined') {
      setHasExtension(!!window.nostr);
    }
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated and not guest
    if (!npub && !isGuest && window.location.pathname !== '/') {
      router.push('/');
    }
  }, [npub, isGuest, router]);

  const login = async () => {
    try {
      if (!window.nostr) {
        throw new Error('Nostr extension not found');
      }

      const pubkey = await window.nostr.getPublicKey();
      if (!pubkey) {
        throw new Error('Failed to get public key');
      }

      // Get profile data if available
      let profileData = { name: 'Nostr User' };
      if (window.nostr.getProfile) {
        try {
          const nostrProfile = await window.nostr.getProfile();
          profileData = {
            name: nostrProfile.name || 'Nostr User',
            picture: nostrProfile.picture
          };
        } catch (error) {
          console.error('Failed to get profile:', error);
        }
      }

      setNpub(pubkey);
      setProfile(profileData);
      setIsGuest(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const continueAsGuest = () => {
    setNpub(null);
    setProfile({
      name: 'Guest User',
      picture: undefined
    });
    setIsGuest(true);
    router.push('/dashboard');
  };

  const logout = () => {
    setNpub(null);
    setProfile(null);
    setIsGuest(false);
    router.push('/');
    router.refresh();
  };

  return (
    <NostrContext.Provider
      value={{
        npub,
        isAuthenticated: !!npub,
        isGuest,
        login,
        logout,
        continueAsGuest,
        hasExtension,
        profile
      }}
    >
      {children}
    </NostrContext.Provider>
  );
}

export function useNostr() {
  const context = useContext(NostrContext);
  if (context === undefined) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  return context;
} 