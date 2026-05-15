export type TropeGenre =
  | "Romance" | "Fantasy" | "Thriller & Mystery"
  | "Literary & Contemporary" | "Science Fiction"
  | "Horror" | "Historical" | "Young Adult";

export const TROPES_BY_GENRE: Record<TropeGenre, string[]> = {
  "Romance": ["enemies-to-lovers","slow burn","fake dating","second chance","forbidden love","love triangle","rivals to lovers","forced proximity","grumpy x sunshine","best friends to lovers","one bed","marriage of convenience","hurt/comfort","age gap","sports romance","celebrity romance","small town romance","office romance","opposites attract","unrequited love"],
  "Fantasy": ["chosen one","found family","portal fantasy","quest","mentor figure","dark academia","magical realism","anti-hero","prophecy","fae romance","dragon rider","magic academy","heist","political intrigue","war & battle","mythology retelling","necromancer","time magic","thieves guild","ancient evil awakens"],
  "Thriller & Mystery": ["unreliable narrator","whodunit","locked room mystery","serial killer","psychological thriller","conspiracy","cold case","double life","corrupt institution","missing person","amnesia","cat and mouse","twist ending","femme fatale","detective duo","cozy mystery","true crime","legal thriller","spy thriller","revenge plot"],
  "Literary & Contemporary": ["coming of age","redemption arc","grief & loss","family drama","identity crisis","road trip","immigrant experience","class divide","addiction & recovery","friendship","mid-life crisis","epistolary","multiple timelines","unreliable memory","nature vs nurture","social commentary","found home","outsider perspective","generational trauma","quiet life"],
  "Science Fiction": ["time loop","dystopia","space opera","first contact","AI consciousness","post-apocalyptic","cyberpunk","generation ship","body horror","simulation theory","parallel worlds","biopunk","solarpunk","galactic empire","uplift","time travel romance","colony collapse","transhumanism","alien invasion","near future"],
  "Horror": ["haunted house","cosmic horror","psychological horror","monster","folk horror","body horror","cult","creature feature","possession","ghost story","survival horror","gaslighting","isolation horror","small town secrets","cursed object","slow dread","unreliable reality","cabin in the woods","found footage","dark fairy tale"],
  "Historical": ["war & romance","royalty","historical mystery","court intrigue","revolution","pirates","Victorian gothic","Regency romance","ancient world","samurai","witch trials","Tudor court","World War II","Renaissance art","silk road","gladiators","Viking saga","colonial era","mythology retelling","forbidden romance"],
  "Young Adult": ["chosen one","first love","coming of age","found family","dark academia","magic academy","dystopia","forbidden romance","rival to lover","summer romance","identity discovery","secret society","new kid in town","sports","musical prodigy","art & self-expression","social media & fame","mental health journey","supernatural powers","the prophecy"],
};

export const GENRE_ORDER: TropeGenre[] = [
  "Romance","Fantasy","Thriller & Mystery","Literary & Contemporary",
  "Science Fiction","Horror","Historical","Young Adult",
];

export const ALL_TROPES = [...new Set(Object.values(TROPES_BY_GENRE).flat())].sort();
