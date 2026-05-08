import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FamilyProfile = {
  id: string;
  name: string;
  emoji: string;
  age?: number;
  role: "parent" | "child";
  switchPin?: string;
};

const DEFAULT_PROFILE: FamilyProfile = {
  id: "default",
  name: "Me",
  emoji: "📖",
  role: "parent",
};

type FamilyState = {
  profiles: FamilyProfile[];
  activeProfileId: string;
  addProfile: (p: Omit<FamilyProfile, "id">) => string;
  updateProfile: (id: string, patch: Partial<Omit<FamilyProfile, "id">>) => void;
  removeProfile: (id: string) => void;
  _setActiveProfileId: (id: string) => void;
};

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      profiles: [DEFAULT_PROFILE],
      activeProfileId: "default",
      addProfile: (p) => {
        const id = crypto.randomUUID();
        set((s) => ({ profiles: [...s.profiles, { ...p, id }] }));
        return id;
      },
      updateProfile: (id, patch) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProfile: (id) =>
        set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id) })),
      _setActiveProfileId: (id) => set({ activeProfileId: id }),
    }),
    { name: "feltly-family-v1" }
  )
);

export const profileDataKey = (id: string) => `feltly-profile-data-${id}`;

export function saveProfileData(profileId: string, state: unknown): void {
  try {
    localStorage.setItem(profileDataKey(profileId), JSON.stringify(state));
  } catch {}
}

export function loadProfileData(profileId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(profileDataKey(profileId));
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
