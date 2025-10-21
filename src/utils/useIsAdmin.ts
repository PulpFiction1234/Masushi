import { useUserProfile } from "@/context/UserContext";

/**
 * Hook para verificar si el usuario actual tiene rol de admin
 */
export function useIsAdmin(): boolean {
  const { profile } = useUserProfile();
  return profile?.role === 'admin';
}
