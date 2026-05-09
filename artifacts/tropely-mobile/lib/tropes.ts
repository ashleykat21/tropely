export type TropeCategory = {
  name: string;
  emoji: string;
  tropes: string[];
};

export const TROPE_CATEGORIES: TropeCategory[] = [
  {
    name: "Romance",
    emoji: "💕",
    tropes: [
      "Enemies to Lovers","Slow Burn","Fake Dating","Forced Proximity",
      "Friends to Lovers","Second Chance","Love Triangle","Forbidden Love",
      "Grumpy/Sunshine","One Bed","Childhood Sweethearts","Brother's Best Friend",
      "Age Gap","Marriage of Convenience","Unrequited Love","Rivals to Lovers",
      "Boss/Employee","Protector Romance","Secret Admirer","Opposites Attract",
      "Vacation Romance","Celebrity Romance","Workplace Romance","Amnesia Romance",
      "Summer Fling","Pen Pals","Matchmaker Gone Wrong","Only One Left",
      "Hate to Love","Touch-Starved","Accidental Marriage","Roommates",
      "Small Town Romance","Sports Romance","Holiday Romance","Best Friend's Ex",
      "Bodyguard Romance","Royal Romance",
    ],
  },
  {
    name: "Fantasy & Adventure",
    emoji: "⚔️",
    tropes: [
      "Chosen One","Found Family","Magic School","Portal Fantasy","Quest",
      "Prophecy","Redemption Arc","Morally Grey Protagonist","Political Intrigue",
      "Dark Academia","Hidden Identity","Reluctant Hero","Mentor & Apprentice",
      "Betrayal","False King","Heist","The Chosen Reject","Anti-Chosen One",
      "Rival Kingdoms","Unlikely Alliance","The Last of Their Kind","Revenge Quest",
      "Secret Society","Magical Curse","Fae Bargain","Dragon Rider","Blood Magic",
      "Fallen Hero","Rise of the Underdog","Thieves' Guild","Court Intrigue",
      "Lost Heir","The Prophecy Child","Monster Hunter","Alchemy","Forbidden Magic",
      "Ancient Evil Returns","Battle of Gods","Mythology Retelling","Epic Journey",
    ],
  },
  {
    name: "Thriller & Mystery",
    emoji: "🔍",
    tropes: [
      "Unreliable Narrator","Whodunnit","Twist Ending","Red Herring",
      "Missing Person","Psychological","Cat and Mouse","Locked Room","Cold Case",
      "Double Cross","Amateur Sleuth","Conspiracy","False Confession",
      "Sleeper Agent","Identity Theft","Corrupt Institution","Whistleblower",
      "The Inside Man","Witness Protection","Unreliable Memory","True Crime",
      "Cozy Mystery","Legal Thriller","Political Thriller","Serial Killer Hunt",
      "Journalist Uncovers Truth","Gaslighting","Wrong Place Wrong Time",
      "The Frame-Up","Heist Gone Wrong",
    ],
  },
  {
    name: "Literary",
    emoji: "📖",
    tropes: [
      "Coming of Age","Anti-Hero","Dual Timeline","Multiple POVs","Epistolary",
      "Road Trip","Fish Out of Water","Grief & Loss","Revenge","Family Saga",
      "Identity Crisis","Immigrant Experience","Class Conflict","Unreliable Memory",
      "Nature vs. Nurture","Found Manuscript","Generational Trauma","The Outsider",
      "Self-Discovery","Loss of Innocence","Moral Dilemma","The Unredeemed",
      "Social Commentary","Parallel Lives","Voice from the Margins","The Misfit",
      "Cultural Clash","Reclaimed Identity","A Life Unlived","The Confession",
      "Stream of Consciousness","Bildungsroman",
    ],
  },
  {
    name: "Sci-Fi",
    emoji: "🚀",
    tropes: [
      "Dystopia","First Contact","AI Uprising","Time Travel","Generation Ship",
      "Simulation Theory","Post-Apocalyptic","Space Opera","Solarpunk","Biopunk",
      "Cyberpunk","Uplift","Hive Mind","Memory Transfer","Climate Collapse",
      "Corporate Dystopia","Alien Invasion","Parallel Universe",
      "Uploaded Consciousness","Robot Rights","Colony World","The Singularity",
      "Megastructure","Alien Diplomacy","Rogue AI","Genetic Engineering",
      "Post-Human","Time Loop","Steampunk","Lost Signal",
    ],
  },
  {
    name: "Horror",
    emoji: "🕯️",
    tropes: [
      "Haunted House","Final Girl","Things in the Dark","Cosmic Horror","Folk Horror",
      "Body Horror","Isolation","Possession","Cult","Creeping Dread",
      "The Unreliable Survivor","Small Town Secret","The Cursed Object",
      "Monsters Among Us","Descent into Madness","The Ancient Pact","Gothic Horror",
      "Psychological Horror","Supernatural Children","The Watcher","Portal to Hell",
      "Wendigo","Found Footage","Outbreak Horror","The Doctor Goes Too Far",
      "Haunted Family Line","Ritual Gone Wrong","Slasher","Lovecraftian",
    ],
  },
  {
    name: "Historical Fiction",
    emoji: "🏛️",
    tropes: [
      "War & Aftermath","Forbidden Love Across Lines","Women Defying Their Era",
      "Secrets of the Past","Dual Timeline","Lost Letters","Rags to Riches",
      "Court Life","Revolutionary Ideals","Survival in Conflict",
      "Hidden Jews/Minorities","The Spy","Colonial Critique","Invented Histories",
      "Myth Retelling","The Servant's Eye","Maritime Adventure","Plague & Survival",
      "Class Crossing","Fall of an Empire","Resistance Fighter","The Witness",
      "Based on True Events","Archaeological Discovery","Medieval Politics",
      "The Outlaw","Salon Society","Victorian Intrigue","Wild West",
      "Renaissance Intrigue",
    ],
  },
  {
    name: "Contemporary",
    emoji: "🌆",
    tropes: [
      "Midlife Reinvention","Grief Journey","Found Community","Career Pivot",
      "Return to Roots","Online vs. Real Life","The Big Mistake",
      "Friends Drift Apart","Estranged Siblings","Single Parent","Toxic Workplace",
      "New City New Life","The Perfect Life Unravels","Trauma Recovery",
      "Friendship Breakup","Finding Your Voice","The Creative Stuck",
      "Unexpected Inheritance","Secret Kept Too Long","Late Bloomer",
      "Quarter-Life Crisis","Social Media Spiral","The Unlikely Mentor",
      "Community Saving Itself","Chosen Family","The Apology","Love After Loss",
      "Burnout Recovery","The Side Hustle","Unlikely Friendship",
    ],
  },
  {
    name: "Paranormal & Urban Fantasy",
    emoji: "🌙",
    tropes: [
      "Vampire Romance","Werewolf Pack","Witch Discovers Powers",
      "Hunter & Monster Love","Fated Mates","Chosen Vessel","Angels & Demons",
      "Necromancer","Supernatural Academy","Half-Breed","The Prophesied Pair",
      "Hidden Magical World","Monster Rehabilitation","Demon Bargain","Soul Bond",
      "Ghost Companion","The Familiar","Magic Tattoos","Underworld Politics",
      "Cursed Immortal","Shifter Romance","Psychic Abilities","Time-Trapped Spirit",
      "Witch Coven","The Chosen Champion","Banishment & Return","Siren Call",
      "Dragon Hoard","Fallen Angel","Reaper Romance",
    ],
  },
  {
    name: "Cozy & Comfort",
    emoji: "☕",
    tropes: [
      "Bookshop Setting","Bakery/Café Setting","Slow Life","Moving to the Country",
      "Quaint Village Mystery","Healing Retreat","Found Family Dinner",
      "Gardening as Metaphor","The Gentle Fix-It","Animal Companions",
      "Seasons Changing","Pen Pal Connection","Cottage Core","The Art of Letting Go",
      "Recipes as Love Language","Community Garden","Rainy Day Romance",
      "Library as Sanctuary","Quiet Revolution","Soft Magic System",
      "The Long Walk Home","Baking Competition","Nostalgic Homecoming",
      "Old Letters Found","A Year in Provence","The Healing Hobby","Simple Joys",
      "Mentorship Across Ages","The Unexpected Kindness","Slow Friendship",
    ],
  },
];

export const ALL_TROPES: string[] = TROPE_CATEGORIES.flatMap((c) => c.tropes);

const CATEGORY_COLORS: Record<string, string> = {
  "Romance":                    "#D97B9B",
  "Fantasy & Adventure":        "#5A9E76",
  "Thriller & Mystery":         "#5A789E",
  "Literary":                   "#C49A4A",
  "Sci-Fi":                     "#3BA8C4",
  "Horror":                     "#9E4A3A",
  "Historical Fiction":         "#C49060",
  "Contemporary":               "#C47A55",
  "Paranormal & Urban Fantasy": "#9E7CCC",
  "Cozy & Comfort":             "#D4874A",
};

export function tropeCategory(trope: string): TropeCategory | undefined {
  return TROPE_CATEGORIES.find((c) => c.tropes.includes(trope));
}

export function tropeCategoryColor(trope: string): string {
  const cat = tropeCategory(trope);
  if (!cat) return "#9E7CCC";
  return CATEGORY_COLORS[cat.name] ?? "#9E7CCC";
}

export function suggestTropes(title: string, tags: string[], mood?: string): string[] {
  const text = [title, ...tags].join(" ").toLowerCase();
  const s: string[] = [];

  if (/romance|love|heart|kiss|wedding/.test(text))    s.push("Slow Burn","Enemies to Lovers","Friends to Lovers");
  if (/enemies|rivals/.test(text))                      s.push("Enemies to Lovers","Rivals to Lovers");
  if (/fake|pretend/.test(text))                        s.push("Fake Dating","Marriage of Convenience");
  if (/magic|wizard|witch|dragon|fantasy|quest/.test(text)) s.push("Found Family","Chosen One","Quest");
  if (/school|academy|dark academia/.test(text))        s.push("Dark Academia","Coming of Age","Magic School");
  if (/heist|thief/.test(text))                         s.push("Heist","Thieves' Guild");
  if (/mystery|detective|murder|crime/.test(text))      s.push("Whodunnit","Unreliable Narrator","Twist Ending");
  if (/dystop|apocalyp|space|robot/.test(text))         s.push("Dystopia","Post-Apocalyptic","Space Opera");
  if (/horror|ghost|haunted|demon/.test(text))          s.push("Haunted House","Cosmic Horror","Folk Horror");
  if (/war|wwii|soldier/.test(text))                    s.push("War & Aftermath","Survival in Conflict");
  if (/vampire|blood|immortal/.test(text))              s.push("Vampire Romance","Cursed Immortal","Fated Mates");
  if (/werewolf|wolf|pack/.test(text))                  s.push("Werewolf Pack","Fated Mates","Shifter Romance");
  if (/café|bakery|coffee/.test(text))                  s.push("Bakery/Café Setting","Recipes as Love Language");
  if (/bookshop|library/.test(text))                    s.push("Bookshop Setting","Library as Sanctuary");
  if (/grief|loss|mourn/.test(text))                    s.push("Grief & Loss","Love After Loss");

  if (s.length === 0 && mood) {
    const fallback: Record<string, string[]> = {
      calm:       ["Slow Burn","Found Family","Dual Timeline","Slow Life","Bookshop Setting"],
      cozy:       ["Found Family","Bakery/Café Setting","Small Town Romance","Cottage Core"],
      joyful:     ["Friends to Lovers","Coming of Age","Holiday Romance","Unlikely Friendship"],
      dreamy:     ["Slow Burn","Dual Timeline","Fated Mates","Portal Fantasy"],
      melancholy: ["Grief & Loss","Dual Timeline","Redemption Arc","Unreliable Memory"],
      intense:    ["Redemption Arc","Political Intrigue","Rivals to Lovers","Cat and Mouse"],
      mysterious: ["Whodunnit","Unreliable Narrator","Twist Ending","Cold Case"],
    };
    s.push(...(fallback[mood] ?? []));
  }

  return [...new Set(s)].slice(0, 5);
}
