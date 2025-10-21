import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import type { UserProfile, Favorite } from '@/types/user';

interface UserContextType {
  profile: UserProfile | null;
  favorites: Set<string>; // Set de códigos de productos favoritos
  loading: boolean;
  addFavorite: (productCode: string) => Promise<void>;
  removeFavorite: (productCode: string) => Promise<void>;
  isFavorite: (productCode: string) => boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { full_name: string; phone: string; address?: string }) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUserProfile = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Cargar perfil y favoritos
  const loadUserData = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Cargar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Si no existe perfil, crearlo desde metadata
        const metadata = user.user_metadata || {};
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: metadata.full_name || 'Usuario',
            phone: metadata.phone || '',
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile);
        }
      } else {
        setProfile(profileData);
      }

      // Cargar favoritos
      const { data: favData } = await supabase
        .from('favorites')
        .select('product_code')
        .eq('user_id', user.id);

      if (favData) {
        setFavorites(new Set(favData.map(f => f.product_code)));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const addFavorite = useCallback(async (productCode: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_code: productCode });

      if (!error) {
        setFavorites(prev => new Set([...prev, productCode]));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }, [user, supabase]);

  const removeFavorite = useCallback(async (productCode: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_code', productCode);

      if (!error) {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(productCode);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }, [user, supabase]);

  const isFavorite = useCallback((productCode: string) => {
    return favorites.has(productCode);
  }, [favorites]);

  const refreshProfile = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  const updateProfile = useCallback(async (data: { full_name: string; phone: string; address?: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (!error) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [user, supabase, refreshProfile]);

  return (
    <UserContext.Provider
      value={{
        profile,
        favorites,
        loading,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
