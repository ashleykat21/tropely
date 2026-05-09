import { useLibrary } from "./store";
import { useFamilyStore } from "./familyStore";

export function useVisibleBooks() {
  const books = useLibrary((s) => s.books);
  const { profiles, activeProfileId } = useFamilyStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  if (!activeProfile || activeProfile.role === "parent" || !activeProfile.age || activeProfile.age >= 18) {
    return books;
  }

  return books.filter((b) => {
    if (!b.ageRating) return true;
    return b.ageRating <= activeProfile.age!;
  });
}
