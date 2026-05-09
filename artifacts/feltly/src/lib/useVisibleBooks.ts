import { useLibrary, type AgeRating } from "./store";
import { useFamilyStore } from "./familyStore";

const RATING_ORDER: AgeRating[] = ["children", "middle-grade", "young-adult", "adult"];

function maxRatingForAge(age: number): AgeRating {
  if (age < 13) return "middle-grade";
  if (age < 18) return "young-adult";
  return "adult";
}

export function useVisibleBooks() {
  const books = useLibrary((s) => s.books);
  const { profiles, activeProfileId } = useFamilyStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  if (!activeProfile || activeProfile.role === "parent" || !activeProfile.age || activeProfile.age >= 18) {
    return books;
  }

  const maxRating = maxRatingForAge(activeProfile.age);
  const maxIdx = RATING_ORDER.indexOf(maxRating);

  return books.filter((b) => {
    if (!b.ageRating) return true;
    const idx = RATING_ORDER.indexOf(b.ageRating);
    return idx === -1 || idx <= maxIdx;
  });
}
