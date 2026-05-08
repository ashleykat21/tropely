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
      "Enemies to Lovers",
      "Slow Burn",
      "Fake Dating",
      "Forced Proximity",
      "Friends to Lovers",
      "Second Chance",
      "Love Triangle",
      "Forbidden Love",
      "Grumpy/Sunshine",
      "One Bed",
      "Childhood Sweethearts",
      "Brother's Best Friend",
      "Age Gap",
      "Marriage of Convenience",
      "Unrequited Love",
      "Rivals to Lovers",
      "Boss/Employee",
      "Protector Romance",
      "Secret Admirer",
      "Opposites Attract",
      "Vacation Romance",
      "Celebrity Romance",
      "Workplace Romance",
      "Amnesia Romance",
      "Summer Fling",
      "Pen Pals",
      "Matchmaker Gone Wrong",
      "Only One Left",
      "Hate to Love",
      "Touch-Starved",
      "Accidental Marriage",
      "Roommates",
      "Small Town Romance",
      "Sports Romance",
      "Holiday Romance",
      "Best Friend's Ex",
      "Bodyguard Romance",
      "Royal Romance",
    ],
  },
  {
    name: "Fantasy & Adventure",
    emoji: "⚔️",
    tropes: [
      "Chosen One",
      "Found Family",
      "Magic School",
      "Portal Fantasy",
      "Quest",
      "Prophecy",
      "Redemption Arc",
      "Morally Grey Protagonist",
      "Political Intrigue",
      "Dark Academia",
      "Hidden Identity",
      "Reluctant Hero",
      "Mentor & Apprentice",
      "Betrayal",
      "False King",
      "Heist",
      "The Chosen Reject",
      "Anti-Chosen One",
      "Rival Kingdoms",
      "Unlikely Alliance",
      "The Last of Their Kind",
      "Revenge Quest",
      "Secret Society",
      "Magical Curse",
      "Fae Bargain",
      "Dragon Rider",
      "Blood Magic",
      "Fallen Hero",
      "Rise of the Underdog",
      "Thieves' Guild",
      "Court Intrigue",
      "Lost Heir",
      "The Prophecy Child",
      "Monster Hunter",
      "Alchemy",
      "Forbidden Magic",
      "Ancient Evil Returns",
      "Battle of Gods",
      "Mythology Retelling",
      "Epic Journey",
    ],
  },
  {
    name: "Thriller & Mystery",
    emoji: "🔍",
    tropes: [
      "Unreliable Narrator",
      "Whodunnit",
      "Twist Ending",
      "Red Herring",
      "Missing Person",
      "Psychological",
      "Cat and Mouse",
      "Locked Room",
      "Cold Case",
      "Double Cross",
      "Amateur Sleuth",
      "Conspiracy",
      "False Confession",
      "Sleeper Agent",
      "Identity Theft",
      "Corrupt Institution",
      "Whistleblower",
      "The Inside Man",
      "Witness Protection",
      "Unreliable Memory",
      "True Crime",
      "Cozy Mystery",
      "Legal Thriller",
      "Political Thriller",
      "Serial Killer Hunt",
      "Journalist Uncovers Truth",
      "Gaslighting",
      "Wrong Place Wrong Time",
      "The Frame-Up",
      "Heist Gone Wrong",
    ],
  },
  {
    name: "Literary",
    emoji: "📖",
    tropes: [
      "Coming of Age",
      "Anti-Hero",
      "Dual Timeline",
      "Multiple POVs",
      "Epistolary",
      "Road Trip",
      "Fish Out of Water",
      "Grief & Loss",
      "Revenge",
      "Family Saga",
      "Identity Crisis",
      "Immigrant Experience",
      "Class Conflict",
      "Unreliable Memory",
      "Nature vs. Nurture",
      "Found Manuscript",
      "Generational Trauma",
      "The Outsider",
      "Self-Discovery",
      "Loss of Innocence",
      "Moral Dilemma",
      "The Unredeemed",
      "Social Commentary",
      "Parallel Lives",
      "Voice from the Margins",
      "The Misfit",
      "Cultural Clash",
      "Reclaimed Identity",
      "A Life Unlived",
      "The Confession",
      "Stream of Consciousness",
      "Bildungsroman",
    ],
  },
  {
    name: "Sci-Fi",
    emoji: "🚀",
    tropes: [
      "Dystopia",
      "First Contact",
      "AI Uprising",
      "Time Travel",
      "Generation Ship",
      "Simulation Theory",
      "Post-Apocalyptic",
      "Space Opera",
      "Solarpunk",
      "Biopunk",
      "Cyberpunk",
      "Uplift",
      "Hive Mind",
      "Memory Transfer",
      "Climate Collapse",
      "Corporate Dystopia",
      "Alien Invasion",
      "Parallel Universe",
      "Uploaded Consciousness",
      "Robot Rights",
      "Colony World",
      "The Singularity",
      "Megastructure",
      "Alien Diplomacy",
      "Rogue AI",
      "Genetic Engineering",
      "Post-Human",
      "Time Loop",
      "Steampunk",
      "Lost Signal",
    ],
  },
  {
    name: "Horror",
    emoji: "🕯️",
    tropes: [
      "Haunted House",
      "Final Girl",
      "Things in the Dark",
      "Cosmic Horror",
      "Folk Horror",
      "Body Horror",
      "Isolation",
      "Possession",
      "Cult",
      "Creeping Dread",
      "The Unreliable Survivor",
      "Small Town Secret",
      "The Cursed Object",
      "Monsters Among Us",
      "Descent into Madness",
      "The Ancient Pact",
      "Gothic Horror",
      "Psychological Horror",
      "Supernatural Children",
      "The Watcher",
      "Portal to Hell",
      "Wendigo",
      "Found Footage",
      "Outbreak Horror",
      "The Doctor Goes Too Far",
      "Haunted Family Line",
      "Ritual Gone Wrong",
      "Slasher",
      "Lovecraftian",
    ],
  },
  {
    name: "Historical Fiction",
    emoji: "🏛️",
    tropes: [
      "War & Aftermath",
      "Forbidden Love Across Lines",
      "Women Defying Their Era",
      "Secrets of the Past",
      "Dual Timeline",
      "Lost Letters",
      "Rags to Riches",
      "Court Life",
      "Revolutionary Ideals",
      "Survival in Conflict",
      "Hidden Jews/Minorities",
      "The Spy",
      "Colonial Critique",
      "Invented Histories",
      "Myth Retelling",
      "The Servant's Eye",
      "Maritime Adventure",
      "Plague & Survival",
      "Class Crossing",
      "Fall of an Empire",
      "Resistance Fighter",
      "The Witness",
      "Based on True Events",
      "Archaeological Discovery",
      "Medieval Politics",
      "The Outlaw",
      "Salon Society",
      "Victorian Intrigue",
      "Wild West",
      "Renaissance Intrigue",
    ],
  },
  {
    name: "Contemporary",
    emoji: "🌆",
    tropes: [
      "Midlife Reinvention",
      "Grief Journey",
      "Found Community",
      "Career Pivot",
      "Return to Roots",
      "Online vs. Real Life",
      "The Big Mistake",
      "Friends Drift Apart",
      "Estranged Siblings",
      "Single Parent",
      "Toxic Workplace",
      "New City New Life",
      "The Perfect Life Unravels",
      "Trauma Recovery",
      "Friendship Breakup",
      "Finding Your Voice",
      "The Creative Stuck",
      "Unexpected Inheritance",
      "Secret Kept Too Long",
      "Late Bloomer",
      "Quarter-Life Crisis",
      "Social Media Spiral",
      "The Unlikely Mentor",
      "Community Saving Itself",
      "Chosen Family",
      "The Apology",
      "Love After Loss",
      "Burnout Recovery",
      "The Side Hustle",
      "Unlikely Friendship",
    ],
  },
  {
    name: "Paranormal & Urban Fantasy",
    emoji: "🌙",
    tropes: [
      "Vampire Romance",
      "Werewolf Pack",
      "Witch Discovers Powers",
      "Hunter & Monster Love",
      "Fated Mates",
      "Chosen Vessel",
      "Angels & Demons",
      "Necromancer",
      "Supernatural Academy",
      "Half-Breed",
      "The Prophesied Pair",
      "Hidden Magical World",
      "Monster Rehabilitation",
      "Demon Bargain",
      "Soul Bond",
      "Ghost Companion",
      "The Familiar",
      "Magic Tattoos",
      "Underworld Politics",
      "Cursed Immortal",
      "Shifter Romance",
      "Psychic Abilities",
      "Time-Trapped Spirit",
      "Witch Coven",
      "The Chosen Champion",
      "Banishment & Return",
      "Siren Call",
      "Dragon Hoard",
      "Fallen Angel",
      "Reaper Romance",
    ],
  },
  {
    name: "Cozy & Comfort",
    emoji: "☕",
    tropes: [
      "Bookshop Setting",
      "Bakery/Café Setting",
      "Slow Life",
      "Moving to the Country",
      "Quaint Village Mystery",
      "Healing Retreat",
      "Found Family Dinner",
      "Gardening as Metaphor",
      "The Gentle Fix-It",
      "Animal Companions",
      "Seasons Changing",
      "Pen Pal Connection",
      "Cottage Core",
      "The Art of Letting Go",
      "Recipes as Love Language",
      "Community Garden",
      "Rainy Day Romance",
      "Library as Sanctuary",
      "Quiet Revolution",
      "Soft Magic System",
      "The Long Walk Home",
      "Baking Competition",
      "Nostalgic Homecoming",
      "Old Letters Found",
      "A Year in Provence",
      "The Healing Hobby",
      "Simple Joys",
      "Mentorship Across Ages",
      "The Unexpected Kindness",
      "Slow Friendship",
    ],
  },
];

export const ALL_TROPES: string[] = TROPE_CATEGORIES.flatMap((c) => c.tropes);

/** HSL colour per trope category — drives the page gradient when a trope is active */
const CATEGORY_COLORS: Record<string, { h: number; s: number; l: number }> = {
  "Romance":                    { h: 340, s: 50, l: 65 },
  "Fantasy & Adventure":        { h: 148, s: 38, l: 48 },
  "Thriller & Mystery":         { h: 215, s: 30, l: 45 },
  "Literary":                   { h:  38, s: 42, l: 55 },
  "Sci-Fi":                     { h: 195, s: 65, l: 50 },
  "Horror":                     { h:   5, s: 45, l: 38 },
  "Historical Fiction":         { h:  42, s: 48, l: 52 },
  "Contemporary":               { h:  18, s: 45, l: 58 },
  "Paranormal & Urban Fantasy": { h: 270, s: 42, l: 52 },
  "Cozy & Comfort":             { h:  28, s: 52, l: 60 },
};

/**
 * Sets --mood-h/s/l based on the trope's category, giving the page a
 * distinct gradient per genre. Falls back silently if trope is unknown.
 */
export function applyTrope(trope: string): boolean {
  const cat = TROPE_CATEGORIES.find((c) => c.tropes.includes(trope));
  if (!cat) return false;
  const color = CATEGORY_COLORS[cat.name];
  if (!color) return false;
  const r = document.documentElement;
  r.style.setProperty("--mood-h", String(color.h));
  r.style.setProperty("--mood-s", `${color.s}%`);
  r.style.setProperty("--mood-l", `${color.l}%`);
  return true;
}

export function tropeCategory(trope: string): TropeCategory | undefined {
  return TROPE_CATEGORIES.find((c) => c.tropes.includes(trope));
}

export function suggestTropes(title: string, tags: string[], mood?: string): string[] {
  const text = [title, ...tags].join(" ").toLowerCase();
  const suggestions: string[] = [];

  if (/romance|love|heart|kiss|wedding|bride|groom|marriage/.test(text))
    suggestions.push("Slow Burn", "Enemies to Lovers", "Friends to Lovers");
  if (/enemies|rivals|rival/.test(text))
    suggestions.push("Enemies to Lovers", "Rivals to Lovers");
  if (/fake|pretend|arrangement/.test(text))
    suggestions.push("Fake Dating", "Marriage of Convenience");
  if (/boss|ceo|office|workplace|employee/.test(text))
    suggestions.push("Boss/Employee", "Workplace Romance", "Toxic Workplace");
  if (/roommate|apartment|flat/.test(text))
    suggestions.push("Roommates", "Forced Proximity");
  if (/bodyguard|protect|guard/.test(text))
    suggestions.push("Bodyguard Romance", "Protector Romance");
  if (/royal|prince|princess|king|queen|court/.test(text))
    suggestions.push("Royal Romance", "Court Intrigue", "Lost Heir");
  if (/celebrity|famous|star|popstar|actor/.test(text))
    suggestions.push("Celebrity Romance", "Forbidden Love");
  if (/small.town|village|hometown/.test(text))
    suggestions.push("Small Town Romance", "Return to Roots", "Quaint Village Mystery");
  if (/holiday|christmas|winter|summer/.test(text))
    suggestions.push("Holiday Romance", "Summer Fling");

  if (/magic|wizard|witch|dragon|elf|fantasy|quest|sword|sorcery/.test(text))
    suggestions.push("Found Family", "Chosen One", "Quest");
  if (/school|academy|college|university|dark academia/.test(text))
    suggestions.push("Dark Academia", "Coming of Age", "Magic School");
  if (/heist|thief|steal|rob/.test(text))
    suggestions.push("Heist", "Thieves' Guild", "Heist Gone Wrong");
  if (/fae|faery|fairy|sidhe/.test(text))
    suggestions.push("Fae Bargain", "Forbidden Love", "Hidden Magical World");
  if (/prophecy|chosen|destined/.test(text))
    suggestions.push("Prophecy", "Chosen One", "Anti-Chosen One");
  if (/kingdom|empire|throne|heir/.test(text))
    suggestions.push("Lost Heir", "Court Intrigue", "Political Intrigue");
  if (/myth|god|goddess|olymp|greek|norse/.test(text))
    suggestions.push("Mythology Retelling", "Battle of Gods", "Forbidden Love");

  if (/mystery|detective|murder|crime|killer|thriller/.test(text))
    suggestions.push("Whodunnit", "Unreliable Narrator", "Twist Ending");
  if (/conspiracy|government|secret|agency/.test(text))
    suggestions.push("Conspiracy", "Whistleblower", "The Inside Man");
  if (/lawyer|legal|court|trial|judge/.test(text))
    suggestions.push("Legal Thriller", "False Confession");
  if (/cold.case|unsolved|old crime/.test(text))
    suggestions.push("Cold Case", "Journalist Uncovers Truth");
  if (/cozy.mystery|amateur|sleuth/.test(text))
    suggestions.push("Cozy Mystery", "Amateur Sleuth", "Small Town Secret");

  if (/dystop|apocalyp|future|sci.fi|space|robot|android|ai /.test(text))
    suggestions.push("Dystopia", "Post-Apocalyptic", "Space Opera");
  if (/cyber|hack|corporation|megacorp/.test(text))
    suggestions.push("Cyberpunk", "Corporate Dystopia", "Rogue AI");
  if (/climate|earth|environment|solar/.test(text))
    suggestions.push("Solarpunk", "Climate Collapse", "Post-Apocalyptic");
  if (/time.travel|time.loop|loop|repeat/.test(text))
    suggestions.push("Time Travel", "Time Loop");
  if (/alien|contact|extraterrestrial/.test(text))
    suggestions.push("First Contact", "Alien Invasion", "Alien Diplomacy");
  if (/simulation|matrix|virtual|uploaded/.test(text))
    suggestions.push("Simulation Theory", "Uploaded Consciousness");
  if (/steam|gear|victorian.sci/.test(text))
    suggestions.push("Steampunk", "Victorian Intrigue");

  if (/horror|ghost|haunted|demon|vampire|supernatural|cult/.test(text))
    suggestions.push("Haunted House", "Cosmic Horror", "Folk Horror");
  if (/possession|exorcis/.test(text))
    suggestions.push("Possession", "Ritual Gone Wrong");
  if (/lovecraft|elder|void|ancient evil/.test(text))
    suggestions.push("Lovecraftian", "Cosmic Horror");
  if (/slasher|killer|mask/.test(text))
    suggestions.push("Slasher", "Final Girl");
  if (/psych|madness|sanity|asylum/.test(text))
    suggestions.push("Psychological Horror", "Descent into Madness");

  if (/war|wwii|ww2|world.war|battle|trench|soldier|veteran/.test(text))
    suggestions.push("War & Aftermath", "Survival in Conflict", "Resistance Fighter");
  if (/historical|victorian|medieval|tudor|roman|ancient|century/.test(text))
    suggestions.push("Court Life", "Forbidden Love Across Lines", "Women Defying Their Era");
  if (/spy|espionage|intelligence|agent/.test(text))
    suggestions.push("The Spy", "Sleeper Agent", "Double Cross");
  if (/letter|epistol|diary|journal|memoir/.test(text))
    suggestions.push("Epistolary", "Lost Letters", "Unreliable Narrator");
  if (/plague|pandemic|disease|epidemic/.test(text))
    suggestions.push("Plague & Survival", "Isolation", "Outbreak Horror");

  if (/vampire|blood|immortal|undead/.test(text))
    suggestions.push("Vampire Romance", "Cursed Immortal", "Fated Mates");
  if (/werewolf|wolf|pack|shifter/.test(text))
    suggestions.push("Werewolf Pack", "Fated Mates", "Shifter Romance");
  if (/witch|coven|spell|potion/.test(text))
    suggestions.push("Witch Discovers Powers", "Witch Coven", "Forbidden Magic");
  if (/angel|demon|heaven|hell|devil/.test(text))
    suggestions.push("Angels & Demons", "Fallen Angel", "Reaper Romance");
  if (/ghost|spirit|haunting|afterlife/.test(text))
    suggestions.push("Ghost Companion", "Time-Trapped Spirit", "Haunted Family Line");
  if (/soul|bond|mate|fated/.test(text))
    suggestions.push("Fated Mates", "Soul Bond", "The Prophesied Pair");
  if (/psychic|mind|telekinesis|empath/.test(text))
    suggestions.push("Psychic Abilities", "Hive Mind");

  if (/café|bakery|coffee|bake|bread|recipe/.test(text))
    suggestions.push("Bakery/Café Setting", "Recipes as Love Language", "Slow Life");
  if (/bookshop|bookstore|library|librarian/.test(text))
    suggestions.push("Bookshop Setting", "Library as Sanctuary");
  if (/cottage|garden|countryside|country.life|farm/.test(text))
    suggestions.push("Cottage Core", "Moving to the Country", "Gardening as Metaphor");
  if (/cozy|comfort|gentle|soft/.test(text))
    suggestions.push("Slow Life", "Simple Joys", "Healing Retreat");

  if (/family|siblings|brother|sister|parent|mother|father/.test(text))
    suggestions.push("Family Saga", "Found Family", "Estranged Siblings");
  if (/friend|friendship|companion|partner/.test(text))
    suggestions.push("Found Family", "Friends to Lovers", "Unlikely Friendship");
  if (/grief|loss|death|mourn|widow/.test(text))
    suggestions.push("Grief & Loss", "Love After Loss", "Grief Journey");
  if (/trauma|healing|recovery|therapy/.test(text))
    suggestions.push("Trauma Recovery", "Healing Retreat", "Self-Discovery");
  if (/coming.of.age|young adult|ya |teen|grow/.test(text))
    suggestions.push("Coming of Age", "Friends to Lovers", "Loss of Innocence");
  if (/secret|hidden|lie|truth|reveal/.test(text))
    suggestions.push("Hidden Identity", "Twist Ending", "Secret Kept Too Long");
  if (/time|past|memory|remember|nostalgia/.test(text))
    suggestions.push("Dual Timeline", "Unreliable Memory", "Nostalgic Homecoming");
  if (/identity|who am i|self|discover/.test(text))
    suggestions.push("Identity Crisis", "Self-Discovery", "Reclaimed Identity");
  if (/class|wealth|poor|rich|privilege/.test(text))
    suggestions.push("Class Conflict", "Rags to Riches", "Class Crossing");
  if (/immigrant|migrant|asylum|refugee|exile/.test(text))
    suggestions.push("Immigrant Experience", "Cultural Clash");
  if (/road.trip|journey|travel|adventure/.test(text))
    suggestions.push("Road Trip", "Epic Journey", "Quest");
  if (/revenge|vengeance|payback/.test(text))
    suggestions.push("Revenge", "Revenge Quest", "Cat and Mouse");
  if (/burnout|career|work|job|office/.test(text))
    suggestions.push("Burnout Recovery", "Career Pivot", "Midlife Reinvention");

  // Mood-based fallback when title/tags give no signal
  if (suggestions.length === 0 && mood) {
    if (mood === "calm")       suggestions.push("Slow Burn", "Found Family", "Dual Timeline", "Slow Life", "Bookshop Setting");
    if (mood === "cozy")       suggestions.push("Found Family", "Bakery/Café Setting", "Small Town Romance", "Cottage Core", "Slow Life");
    if (mood === "joyful")     suggestions.push("Friends to Lovers", "Coming of Age", "Holiday Romance", "Unlikely Friendship", "Chosen One");
    if (mood === "dreamy")     suggestions.push("Slow Burn", "Dual Timeline", "Fated Mates", "Portal Fantasy", "Pen Pals");
    if (mood === "melancholy") suggestions.push("Grief & Loss", "Dual Timeline", "Redemption Arc", "Unreliable Memory", "A Life Unlived");
    if (mood === "intense")    suggestions.push("Redemption Arc", "Political Intrigue", "Rivals to Lovers", "Cat and Mouse", "Conspiracy");
    if (mood === "dark")       suggestions.push("Cosmic Horror", "Haunted House", "Unreliable Narrator", "Descent into Madness", "Morally Grey Protagonist");
    if (mood === "mysterious") suggestions.push("Whodunnit", "Unreliable Narrator", "Twist Ending", "Cold Case", "Hidden Identity");
  }

  return [...new Set(suggestions)].slice(0, 5);
}
