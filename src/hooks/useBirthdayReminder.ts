import { useCallback, useEffect, useState } from "react";
import { useUserProfile } from "@/context/UserContext";

const SESSION_KEY_PREFIX = "birthday-reminder-session-";
const PERSIST_KEY_PREFIX = "birthday-reminder-never-";

const getStorageItem = (storage: Storage | undefined, key: string) => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const setStorageItem = (storage: Storage | undefined, key: string, value: string) => {
  try {
    storage?.setItem(key, value);
  } catch {
    // Ignore write errors (storage disabled or full)
  }
};

export const useBirthdayReminder = () => {
  const { profile, loading } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [evaluated, setEvaluated] = useState(false);

  const profileId = profile?.id ?? null;
  const hasBirthday = Boolean(profile?.birthday);

  useEffect(() => {
    if (loading) return;

    if (!profileId || hasBirthday) {
      setIsOpen(false);
      setEvaluated(true);
      return;
    }

    if (typeof window === "undefined") {
      setIsOpen(false);
      setEvaluated(true);
      return;
    }

    const persistKey = `${PERSIST_KEY_PREFIX}${profileId}`;
    if (getStorageItem(window.localStorage, persistKey) === "true") {
      setIsOpen(false);
      setEvaluated(true);
      return;
    }

    const sessionKey = `${SESSION_KEY_PREFIX}${profileId}`;
    if (getStorageItem(window.sessionStorage, sessionKey) === "true") {
      setIsOpen(false);
      setEvaluated(true);
      return;
    }

    setIsOpen(true);
    setEvaluated(true);
  }, [loading, profileId, hasBirthday]);

  const dismissForSession = useCallback(() => {
    if (typeof window !== "undefined" && profileId) {
      setStorageItem(window.sessionStorage, `${SESSION_KEY_PREFIX}${profileId}`, "true");
    }
    setIsOpen(false);
  }, [profileId]);

  const dismissForever = useCallback(() => {
    if (typeof window !== "undefined" && profileId) {
      const persistKey = `${PERSIST_KEY_PREFIX}${profileId}`;
      setStorageItem(window.localStorage, persistKey, "true");
      setStorageItem(window.sessionStorage, `${SESSION_KEY_PREFIX}${profileId}`, "true");
    }
    setIsOpen(false);
  }, [profileId]);

  return {
    isOpen,
  profile,
    loading,
    evaluated,
    dismissForSession,
    dismissForever,
  };
};
