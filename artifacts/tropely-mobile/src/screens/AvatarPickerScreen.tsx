import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "@/store";
import MoodBackground from "@/theme/MoodBackground";
import { useAtmosphereKey } from "@/hooks/useAtmosphere";
import AvatarPicker from "@/components/AvatarPicker";
import { useProfile } from "@/hooks/useProfile";
import { getAvatarById, storeToNewCategory, type AvatarCategoryNew } from "@/data/avatars";

export default function AvatarPickerScreen() {
  const nav = useNavigation<any>();
  const atmosphereKey = useAtmosphereKey();
  const selectedAvatar = useStore((s) => s.selectedAvatar);
  const selectedCategory = useStore((s) => s.selectedAvatarCategory);
  const { saveAvatar } = useProfile();

  const [pendingId, setPendingId] = useState(selectedAvatar);
  const [pendingCategory, setPendingCategory] = useState<AvatarCategoryNew>(
    storeToNewCategory(selectedCategory),
  );

  const handleSelect = (id: string, category: AvatarCategoryNew) => {
    setPendingId(id);
    setPendingCategory(category);
  };

  const handleSave = async () => {
    await saveAvatar(pendingId, pendingCategory);
    nav.goBack();
  };

  return (
    <MoodBackground themeId={atmosphereKey} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AvatarPicker
          currentAvatarId={pendingId}
          onSelect={handleSelect}
          onSave={handleSave}
          saveLabel="Save Avatar"
        />
      </SafeAreaView>
    </MoodBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
});
