# Action Icons - Implementation Guide

## Overview
The `ActionIcons.tsx` component provides a set of fantasy-style SVG icons for use throughout the Tropely app. These icons are designed to complement the bottom navigation icons and maintain the fantasy aesthetic across all mood themes.

## Import

```typescript
import {
  FocusModeIcon,
  BookDetailsIcon,
  JournalIcon,
  AICompanionIcon,
  StartReadingIcon,
  LogManuallyIcon,
  AddBookIcon,
  SearchFilterIcon,
} from "@/components/ActionIcons";
```

## Available Icons

### 1. FocusModeIcon
**Purpose:** Focus Mode button/section  
**Symbol:** Moon  
**Usage:**
```tsx
<FocusModeIcon size={24} color={theme.colors.accent} />
```

### 2. BookDetailsIcon
**Purpose:** Book details/information button  
**Symbol:** Open Book  
**Usage:**
```tsx
<BookDetailsIcon size={24} color={theme.colors.button} />
```

### 3. JournalIcon
**Purpose:** Journal entry button  
**Symbol:** Feather/Quill with lines  
**Usage:**
```tsx
<JournalIcon size={24} color={theme.colors.accent} />
```

### 4. AICompanionIcon
**Purpose:** AI Companion button  
**Symbol:** Sparkle Wand  
**Usage:**
```tsx
<AICompanionIcon size={24} color={theme.colors.accent} />
```

### 5. StartReadingIcon
**Purpose:** Begin reading a book  
**Symbol:** Book + Sparkle  
**Usage:**
```tsx
<StartReadingIcon size={24} color={theme.colors.button} />
```

### 6. LogManuallyIcon
**Purpose:** Log reading session manually  
**Symbol:** Pencil/Quill  
**Usage:**
```tsx
<LogManuallyIcon size={24} color={theme.colors.accent} />
```

### 7. AddBookIcon
**Purpose:** Add a new book  
**Symbol:** Plus + Book  
**Usage:**
```tsx
<AddBookIcon size={24} color={theme.colors.button} />
```

### 8. SearchFilterIcon
**Purpose:** Search or filter books  
**Symbol:** Magnifier + Slider  
**Usage:**
```tsx
<SearchFilterIcon size={24} color={theme.colors.subtext} />
```

## Props

All action icons accept the following props:

```typescript
interface ActionIconProps {
  size?: number;        // Icon size in pixels (default: 24)
  color: string;        // Color hex code or theme color reference
}
```

## Common Usage Patterns

### With Button
```tsx
<TouchableOpacity onPress={handlePress}>
  <View style={styles.buttonContainer}>
    <AICompanionIcon size={20} color="#ffffff" />
    <Text style={styles.buttonText}>Open AI Companion</Text>
  </View>
</TouchableOpacity>
```

### With Theme Colors
```tsx
const { theme } = useTheme();

<TouchableOpacity>
  <FocusModeIcon size={24} color={theme.colors.accent} />
</TouchableOpacity>
```

### Multiple Icons in Row
```tsx
<View style={{ flexDirection: "row", gap: 12 }}>
  <StartReadingIcon size={20} color={theme.colors.button} />
  <LogManuallyIcon size={20} color={theme.colors.button} />
  <JournalIcon size={20} color={theme.colors.accent} />
</View>
```

## Color Recommendations by Context

### For Primary Actions
```typescript
color={theme.colors.button}        // Button accent color
color={theme.colors.accent}        // Primary accent (usually more vibrant)
```

### For Secondary Actions
```typescript
color={theme.colors.subtext}       // Subtle, secondary actions
```

### For Interactive States
```typescript
// Active state
color={theme.colors.accent}

// Inactive state
color={theme.colors.subtext}
```

## Sizing Guidelines

- **Small buttons:** `size={18}`
- **Standard buttons:** `size={24}`
- **Large buttons:** `size={32}`
- **Hero buttons:** `size={40}`

## Integration Locations

These icons should be integrated into:

1. **HomeScreen (Today)**
   - Start Reading button
   - Log Manually button
   - Quick access to Focus Mode

2. **LibraryScreen**
   - Add Book button
   - Search/Filter options

3. **DiscoverScreen**
   - Search/Filter icon
   - Explore options

4. **CompanionScreen**
   - AI Companion icon (already visible in modal title)

5. **BookDetailScreen**
   - Book Details icon
   - Journal button
   - AI Companion access
   - Focus Mode entry

6. **ProfileScreen**
   - Journal link
   - Settings navigation

## Styling with Containers

```tsx
const styles = StyleSheet.create({
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
});

<TouchableOpacity style={styles.iconButton}>
  <AICompanionIcon size={24} color={theme.colors.accent} />
</TouchableOpacity>
```

## Accessibility Notes

- Always pair icons with text labels or aria-labels for screen readers
- Ensure color contrast meets WCAG guidelines
- Use sufficient padding around icon buttons (minimum 44x44 touch target)

## Animation Tips

Icons can be wrapped with animated components:

```tsx
<Animated.View style={animatedStyle}>
  <FocusModeIcon size={24} color={theme.colors.accent} />
</Animated.View>
```

## Customization

To modify icon styling:
1. Edit the icon shapes in `ActionIcons.tsx`
2. Adjust stroke widths for more/less boldness
3. Modify opacity values for fade effects
4. Update viewBox if you need different aspect ratios

---

## Example: Complete Action Button Set

```tsx
import { useTheme } from "@/theme/ThemeContext";
import {
  StartReadingIcon,
  LogManuallyIcon,
  JournalIcon,
} from "@/components/ActionIcons";

export function ReadingActions() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <StartReadingIcon size={24} color={theme.colors.button} />
        <Text style={styles.label}>Start</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <LogManuallyIcon size={24} color={theme.colors.accent} />
        <Text style={styles.label}>Log</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <JournalIcon size={24} color={theme.colors.accent} />
        <Text style={styles.label}>Journal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  button: {
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
```

---

**Last Updated:** May 21, 2026
