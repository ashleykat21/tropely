import colors from "@/constants/colors";

/**
 * Returns the warm cream editorial design tokens.
 * Tropely uses a fixed light palette (matching the Lovable web design)
 * regardless of the device color scheme.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}
