import { useCallback } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getApp } from "firebase/app";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/store";
import type { AvatarCategoryNew } from "@/data/avatars";
import { newToStoreCategory } from "@/data/avatars";

function getDb() {
  return getFirestore(getApp());
}

export interface StoredProfile {
  displayName?: string;
  selectedAvatarId?: string;
  selectedAvatarType?: AvatarCategoryNew;
  avatarUpdatedAt?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const setDisplayName = useStore((s) => s.setDisplayName);
  const setSelectedAvatar = useStore((s) => s.setSelectedAvatar);
  const setSelectedAvatarCategory = useStore((s) => s.setSelectedAvatarCategory);

  const saveDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    setDisplayName(trimmed); // Optimistic update to local store
    if (!user) return;
    try {
      await setDoc(
        doc(getDb(), "users", user.uid),
        { displayName: trimmed },
        { merge: true },
      );
    } catch (e) {
      console.warn("[useProfile] saveDisplayName failed:", e);
    }
  }, [user, setDisplayName]);

  const saveAvatar = useCallback(async (
    avatarId: string,
    avatarType: AvatarCategoryNew,
  ) => {
    setSelectedAvatar(avatarId);
    setSelectedAvatarCategory(newToStoreCategory(avatarType));
    if (!user) return;
    try {
      await setDoc(
        doc(getDb(), "users", user.uid),
        {
          selectedAvatarId: avatarId,
          selectedAvatarType: avatarType,
          avatarUpdatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (e) {
      console.warn("[useProfile] saveAvatar failed:", e);
    }
  }, [user, setSelectedAvatar, setSelectedAvatarCategory]);

  const loadProfile = useCallback(async (): Promise<StoredProfile | null> => {
    if (!user) return null;
    try {
      const snap = await getDoc(doc(getDb(), "users", user.uid));
      if (!snap.exists()) return null;
      const data = snap.data() as StoredProfile;
      if (data.displayName) setDisplayName(data.displayName);
      if (data.selectedAvatarId) {
        setSelectedAvatar(data.selectedAvatarId);
        if (data.selectedAvatarType) {
          setSelectedAvatarCategory(newToStoreCategory(data.selectedAvatarType));
        }
      }
      return data;
    } catch (e) {
      console.warn("[useProfile] loadProfile failed:", e);
      return null;
    }
  }, [user, setDisplayName, setSelectedAvatar, setSelectedAvatarCategory]);

  return { saveDisplayName, saveAvatar, loadProfile };
}
