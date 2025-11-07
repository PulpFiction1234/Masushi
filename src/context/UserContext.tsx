import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile, Favorite } from '@/types/user';

export const MAX_SAVED_ADDRESSES = 2;

export type AddressCoords = {
  lat?: number;
  lng?: number;
  numeroCasa?: string | null;
  metaVersion?: number | null;
};

export type AddressRecord = {
  id: number;
  label?: string | null;
  address_text: string;
  coords?: AddressCoords | null;
  created_at?: string | null;
};

export type AddAddressParams = {
  address: string;
  coords?: { lat: number; lng: number } | null;
  label?: string | null;
  numeroCasa?: string | null;
};

interface UserContextType {
  profile: UserProfile | null;
  favorites: Set<string>; // Set de códigos de productos favoritos
  loading: boolean;
  addresses: AddressRecord[];
  isAdmin: boolean; // indicates whether the current user is an administrator
  addFavorite: (productCode: string) => Promise<void>;
  removeFavorite: (productCode: string) => Promise<void>;
  isFavorite: (productCode: string) => boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { full_name: string; phone: string }) => Promise<void>;
  fetchAddresses: () => Promise<void>;
  addAddress: (params: AddAddressParams) => Promise<AddressRecord | null>;
  deleteAddress: (id: number) => Promise<boolean>;
  setBirthday: (dateIso: string) => Promise<{ success: boolean; error?: string }>;
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
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar perfil y favoritos
  const loadUserData = useCallback(async () => {
    // If `user` is null we must check whether the auth client is still
    // restoring session. Use supabase.auth.getSession() to avoid treating a
    // transient null as "not authenticated" (which causes redirects on reload).
  let effectiveUser: SupabaseUser | null = user as SupabaseUser | null;
    if (!user) {
      try {
        const sessionRes = await supabase.auth.getSession();
        const session = sessionRes?.data?.session ?? null;
        if (!session || !session.user) {
          // No active session
          setProfile(null);
          setFavorites(new Set());
          setLoading(false);
          return;
        }
        effectiveUser = session.user;
      } catch (err) {
        // If the call fails, assume no session
        setProfile(null);
        setFavorites(new Set());
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);

      // Cargar perfil
      if (!effectiveUser) {
        setProfile(null);
        setIsAdmin(false);
        setFavorites(new Set());
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', effectiveUser.id)
        .single();

      if (profileError) {
        // Si no existe perfil, crearlo desde metadata
  // supabase user may expose user_metadata; use optional chaining
  const metadata = effectiveUser?.user_metadata ?? {};
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: effectiveUser.id,
            full_name: metadata.full_name || 'Usuario',
            phone: metadata.phone || '',
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile);
          setIsAdmin(Boolean(newProfile.is_admin || newProfile.role === 'admin'));
        }
      } else {
        setProfile(profileData);
        setIsAdmin(Boolean((profileData as UserProfile).is_admin || (profileData as UserProfile).role === 'admin'));
      }

      // Cargar favoritos
      const { data: favData } = await supabase
        .from('favorites')
        .select('product_code')
        .eq('user_id', effectiveUser.id);

      if (favData) {
        setFavorites(new Set(favData.map(f => f.product_code)));
      }
      // Cargar direcciones guardadas
      const { data: addrData, error: addrErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', effectiveUser.id)
        .order('created_at', { ascending: false });
      if (!addrErr && addrData) {
        setAddresses((addrData as AddressRecord[]).slice(0, MAX_SAVED_ADDRESSES));
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

  const updateProfile = useCallback(async (data: { full_name: string; phone: string }) => {
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

  const setBirthday = useCallback(async (dateIso: string) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    const normalized = dateIso.trim();
    if (!normalized) return { success: false, error: 'Fecha inválida' };

    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(normalized)) {
      return { success: false, error: 'Formato de fecha inválido' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ birthday: normalized })
        .eq('id', user.id)
        .is('birthday', null)
        .select('birthday');

      if (error) {
        console.error('Error setting birthday:', error);
        return { success: false, error: 'No se pudo guardar la fecha de cumpleaños' };
      }

      if (!Array.isArray(data) || data.length === 0 || !data[0]?.birthday) {
        return { success: false, error: 'El cumpleaños ya estaba registrado o no se pudo actualizar' };
      }

      await refreshProfile();
      return { success: true };
    } catch (error) {
      console.error('Unexpected error setting birthday:', error);
      return { success: false, error: 'Error inesperado al guardar la fecha de cumpleaños' };
    }
  }, [user, supabase, refreshProfile]);

  // Addresses helpers
  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAddresses((data as AddressRecord[]).slice(0, MAX_SAVED_ADDRESSES));
      }
    } catch (e) {
      console.error('Error fetching addresses:', e);
    }
  }, [user, supabase]);

  const addAddress = useCallback(async ({ address, coords, label, numeroCasa }: AddAddressParams) => {
    if (!user) return null;
    if (addresses.length >= MAX_SAVED_ADDRESSES) {
      console.warn('Address limit reached for user (local cache)');
      return null;
    }
    try {
      const { count: existingCount, error: countError } = await supabase
        .from('addresses')
        .select('*', { head: true, count: 'exact' })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error checking address count:', countError);
        return null;
      }

      if ((existingCount ?? 0) >= MAX_SAVED_ADDRESSES) {
        console.warn('Address limit reached for user (remote check)');
        return null;
      }

      const trimmedLabel = label ? label.trim().slice(0, 64) : null;
      let coordsPayload: AddressCoords | null = null;
      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        coordsPayload = { lat: coords.lat, lng: coords.lng };
      }
      const numeroCasaTrimmed = numeroCasa ? numeroCasa.trim() : '';
      if (numeroCasaTrimmed) {
        coordsPayload = { ...(coordsPayload ?? {}), numeroCasa: numeroCasaTrimmed };
      }
      if (coordsPayload) {
        coordsPayload.metaVersion = 1;
      }
      const payload = { user_id: user.id, label: trimmedLabel, address_text: address, coords: coordsPayload };
      const { data, error } = await supabase.from('addresses').insert(payload).select().single();
      if (error) {
        console.error('Error adding address:', error);
        return null;
      }
      const row = data as AddressRecord | null;
  setAddresses(prev => (row ? [row, ...prev].slice(0, MAX_SAVED_ADDRESSES) : prev));
      return row;
    } catch (e) {
      console.error('Error adding address:', e);
      return null;
    }
  }, [user, supabase, addresses.length]);

  const deleteAddress = useCallback(async (id: number) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        console.error('Error deleting address:', error);
        return false;
      }
      setAddresses(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (e) {
      console.error('Error deleting address:', e);
      return false;
    }
  }, [user, supabase]);

  return (
    <UserContext.Provider
      value={{
        profile,
        favorites,
        loading,
        addresses,
        isAdmin,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshProfile,
        updateProfile,
        fetchAddresses,
        addAddress,
        deleteAddress,
        setBirthday,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
