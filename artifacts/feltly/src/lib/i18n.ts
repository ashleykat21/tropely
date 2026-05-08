import { useSyncExternalStore } from "react";

export type Locale = "en" | "es" | "fr" | "de" | "pt" | "it" | "ja" | "zh" | "nl" | "sv";

const DICTS: Record<Locale, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.discover": "Discover",
    "nav.tropes": "Tropes",
    "nav.journal": "Journal",
    "nav.ai": "Companion",
    "nav.social": "Social",
    "nav.twins": "Twins",
    "nav.insights": "Insights",
    "nav.you": "You",
    "nav.more": "More",
    "nav.wrap": "Wrap",
    "nav.premium": "Premium",
    "common.add_book": "Add a book",
    "common.read_by_emotion": "Read by emotion",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "auth.welcome_back": "Welcome back",
    "auth.create_account": "Create your account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.sign_in": "Sign in",
    "auth.sign_up": "Sign up",
    "auth.continue_google": "Continue with Google",
    "home.currently_reading": "Currently reading",
    "home.your_library": "Your library",
    "settings.language": "Language",
    "settings.language_help": "Choose the language used across Tropely.",
  },
  es: {
    "nav.home": "Inicio",
    "nav.discover": "Descubrir",
    "nav.journal": "Diario",
    "nav.ai": "Compañero",
    "nav.social": "Social",
    "nav.twins": "Gemelos",
    "nav.insights": "Análisis",
    "nav.you": "Tú",
    "nav.more": "Más",
    "nav.wrap": "Resumen",
    "nav.premium": "Premium",
    "common.add_book": "Añadir libro",
    "common.read_by_emotion": "Lee con emoción",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "auth.welcome_back": "Bienvenido de nuevo",
    "auth.create_account": "Crea tu cuenta",
    "auth.email": "Correo",
    "auth.password": "Contraseña",
    "auth.sign_in": "Iniciar sesión",
    "auth.sign_up": "Registrarse",
    "auth.continue_google": "Continuar con Google",
    "home.currently_reading": "Leyendo ahora",
    "home.your_library": "Tu biblioteca",
    "settings.language": "Idioma",
    "settings.language_help": "Elige el idioma de Tropely.",
  },
  fr: {
    "nav.home": "Accueil", "nav.discover": "Explorer", "nav.journal": "Journal",
    "nav.ai": "Compagnon", "nav.social": "Social", "nav.twins": "Jumeaux",
    "nav.insights": "Analyses", "nav.you": "Vous", "nav.more": "Plus",
    "nav.wrap": "Bilan", "nav.premium": "Premium",
    "common.add_book": "Ajouter un livre", "common.read_by_emotion": "Lire avec émotion",
    "common.cancel": "Annuler", "common.save": "Enregistrer",
    "auth.welcome_back": "Bon retour", "auth.create_account": "Créer un compte",
    "auth.email": "E-mail", "auth.password": "Mot de passe",
    "auth.sign_in": "Se connecter", "auth.sign_up": "S'inscrire",
    "auth.continue_google": "Continuer avec Google",
    "home.currently_reading": "En cours de lecture", "home.your_library": "Votre bibliothèque",
    "settings.language": "Langue", "settings.language_help": "Choisissez la langue de Tropely.",
  },
  de: {
    "nav.home": "Start", "nav.discover": "Entdecken", "nav.journal": "Tagebuch",
    "nav.ai": "Begleiter", "nav.social": "Sozial", "nav.twins": "Zwillinge",
    "nav.insights": "Einblicke", "nav.you": "Du", "nav.more": "Mehr",
    "nav.wrap": "Rückblick", "nav.premium": "Premium",
    "common.add_book": "Buch hinzufügen", "common.read_by_emotion": "Lese nach Gefühl",
    "common.cancel": "Abbrechen", "common.save": "Speichern",
    "auth.welcome_back": "Willkommen zurück", "auth.create_account": "Konto erstellen",
    "auth.email": "E-Mail", "auth.password": "Passwort",
    "auth.sign_in": "Anmelden", "auth.sign_up": "Registrieren",
    "auth.continue_google": "Mit Google fortfahren",
    "home.currently_reading": "Aktuell gelesen", "home.your_library": "Deine Bibliothek",
    "settings.language": "Sprache", "settings.language_help": "Wähle die Sprache für Tropely.",
  },
  pt: {
    "nav.home": "Início", "nav.discover": "Descobrir", "nav.journal": "Diário",
    "nav.ai": "Companheiro", "nav.social": "Social", "nav.twins": "Gémeos",
    "nav.insights": "Análises", "nav.you": "Você", "nav.more": "Mais",
    "nav.wrap": "Retrospetiva", "nav.premium": "Premium",
    "common.add_book": "Adicionar livro", "common.read_by_emotion": "Leia por emoção",
    "common.cancel": "Cancelar", "common.save": "Guardar",
    "auth.welcome_back": "Bem-vindo de volta", "auth.create_account": "Criar conta",
    "auth.email": "E-mail", "auth.password": "Palavra-passe",
    "auth.sign_in": "Entrar", "auth.sign_up": "Registar",
    "auth.continue_google": "Continuar com Google",
    "home.currently_reading": "A ler agora", "home.your_library": "A sua biblioteca",
    "settings.language": "Idioma", "settings.language_help": "Escolha o idioma da Tropely.",
  },
  it: {
    "nav.home": "Home", "nav.discover": "Scopri", "nav.journal": "Diario",
    "nav.ai": "Compagno", "nav.social": "Social", "nav.twins": "Gemelli",
    "nav.insights": "Analisi", "nav.you": "Tu", "nav.more": "Altro",
    "nav.wrap": "Resoconto", "nav.premium": "Premium",
    "common.add_book": "Aggiungi libro", "common.read_by_emotion": "Leggi con emozione",
    "common.cancel": "Annulla", "common.save": "Salva",
    "auth.welcome_back": "Bentornato", "auth.create_account": "Crea account",
    "auth.email": "Email", "auth.password": "Password",
    "auth.sign_in": "Accedi", "auth.sign_up": "Registrati",
    "auth.continue_google": "Continua con Google",
    "home.currently_reading": "Sto leggendo", "home.your_library": "La tua libreria",
    "settings.language": "Lingua", "settings.language_help": "Scegli la lingua di Tropely.",
  },
  ja: {
    "nav.home": "ホーム", "nav.discover": "発見", "nav.journal": "ジャーナル",
    "nav.ai": "コンパニオン", "nav.social": "ソーシャル", "nav.twins": "ツインズ",
    "nav.insights": "分析", "nav.you": "あなた", "nav.more": "その他",
    "nav.wrap": "まとめ", "nav.premium": "プレミアム",
    "common.add_book": "本を追加", "common.read_by_emotion": "感情で読む",
    "common.cancel": "キャンセル", "common.save": "保存",
    "auth.welcome_back": "おかえりなさい", "auth.create_account": "アカウント作成",
    "auth.email": "メール", "auth.password": "パスワード",
    "auth.sign_in": "サインイン", "auth.sign_up": "サインアップ",
    "auth.continue_google": "Googleで続行",
    "home.currently_reading": "読書中", "home.your_library": "ライブラリ",
    "settings.language": "言語", "settings.language_help": "Tropelyの言語を選択。",
  },
  zh: {
    "nav.home": "首页", "nav.discover": "发现", "nav.journal": "日志",
    "nav.ai": "伙伴", "nav.social": "社交", "nav.twins": "书友",
    "nav.insights": "洞察", "nav.you": "我", "nav.more": "更多",
    "nav.wrap": "年度回顾", "nav.premium": "高级版",
    "common.add_book": "添加书籍", "common.read_by_emotion": "用情感阅读",
    "common.cancel": "取消", "common.save": "保存",
    "auth.welcome_back": "欢迎回来", "auth.create_account": "创建账户",
    "auth.email": "邮箱", "auth.password": "密码",
    "auth.sign_in": "登录", "auth.sign_up": "注册",
    "auth.continue_google": "使用 Google 继续",
    "home.currently_reading": "正在阅读", "home.your_library": "你的书库",
    "settings.language": "语言", "settings.language_help": "选择 Tropely 的语言。",
  },
  nl: {
    "nav.home": "Home", "nav.discover": "Ontdek", "nav.journal": "Dagboek",
    "nav.ai": "Metgezel", "nav.social": "Sociaal", "nav.twins": "Tweelingen",
    "nav.insights": "Inzichten", "nav.you": "Jij", "nav.more": "Meer",
    "nav.wrap": "Jaaroverzicht", "nav.premium": "Premium",
    "common.add_book": "Boek toevoegen", "common.read_by_emotion": "Lees op gevoel",
    "common.cancel": "Annuleren", "common.save": "Opslaan",
    "auth.welcome_back": "Welkom terug", "auth.create_account": "Account maken",
    "auth.email": "E-mail", "auth.password": "Wachtwoord",
    "auth.sign_in": "Inloggen", "auth.sign_up": "Registreren",
    "auth.continue_google": "Doorgaan met Google",
    "home.currently_reading": "Nu aan het lezen", "home.your_library": "Jouw bibliotheek",
    "settings.language": "Taal", "settings.language_help": "Kies de taal voor Tropely.",
  },
  sv: {
    "nav.home": "Hem", "nav.discover": "Utforska", "nav.journal": "Journal",
    "nav.ai": "Följeslagare", "nav.social": "Socialt", "nav.twins": "Tvillingar",
    "nav.insights": "Insikter", "nav.you": "Du", "nav.more": "Mer",
    "nav.wrap": "Årskrönika", "nav.premium": "Premium",
    "common.add_book": "Lägg till bok", "common.read_by_emotion": "Läs med känsla",
    "common.cancel": "Avbryt", "common.save": "Spara",
    "auth.welcome_back": "Välkommen tillbaka", "auth.create_account": "Skapa konto",
    "auth.email": "E-post", "auth.password": "Lösenord",
    "auth.sign_in": "Logga in", "auth.sign_up": "Registrera",
    "auth.continue_google": "Fortsätt med Google",
    "home.currently_reading": "Läser nu", "home.your_library": "Ditt bibliotek",
    "settings.language": "Språk", "settings.language_help": "Välj språk för Tropely.",
  },
};

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

const STORAGE_KEY = "feltly:locale";

function detectInitial(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && DICTS[stored]) return stored;
  const nav = navigator.language?.toLowerCase() ?? "en";
  const prefix = nav.slice(0, 2) as Locale;
  if (DICTS[prefix]) return prefix;
  return "en";
}

let current: Locale = detectInitial();
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function getSnapshot() {
  return current;
}
function getServerSnapshot() {
  return "en" as Locale;
}

export function setLocale(next: Locale) {
  current = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }
  listeners.forEach((l) => l());
}

export function getLocale(): Locale {
  return current;
}

export function t(key: string): string {
  return DICTS[current][key] ?? DICTS.en[key] ?? key;
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { locale, setLocale, t: (key: string) => DICTS[locale][key] ?? DICTS.en[key] ?? key };
}

// Set initial <html lang> on import
if (typeof document !== "undefined") {
  document.documentElement.lang = current;
}