import { useFamilyStore, saveProfileData, loadProfileData } from "./familyStore";
import { useLibrary, FRESH_PROFILE_STATE } from "./store";

export function switchToProfile(newId: string): void {
  const { activeProfileId, _setActiveProfileId } = useFamilyStore.getState();
  if (activeProfileId === newId) return;

  // Snapshot current profile data before switching
  const currentState = useLibrary.getState();
  saveProfileData(activeProfileId, currentState);

  // Load destination profile's data, or fresh empty state
  const newData = loadProfileData(newId);
  useLibrary.setState(
    (newData as Parameters<typeof useLibrary.setState>[0]) ?? FRESH_PROFILE_STATE
  );

  _setActiveProfileId(newId);
}
