const BLOCKED_TERMS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "crap",
  "dick", "cock", "pussy", "cunt", "whore", "slut",
  "nigger", "nigga", "faggot", "retard",
  "kill yourself", "kys", "go die", "end yourself",
  "porn", "nude", "naked", "sex",
];

export function moderateContent(text: string): { safe: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return { safe: false, reason: "Message contains content not allowed in family-safe mode." };
    }
  }
  if (text.trim().length === 0) {
    return { safe: false, reason: "Message cannot be empty." };
  }
  if (text.length > 1000) {
    return { safe: false, reason: "Message is too long (max 1000 characters)." };
  }
  return { safe: true };
}
