import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { extraDict } from "@/lib/i18n-dict";
import { setFormatLocale } from "@/lib/format";

export const LANGUAGES = [
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const STORAGE_KEY = "northstar.language";

type Dict = Record<string, string>;

const en: Dict = {
  "lang.title": "Choose your language",
  "lang.subtitle": "You can change it at any time from the header.",
  "lang.continue": "Continue",
  "lang.switch": "Language",
  "nav.section.Overview": "Overview",
  "nav.section.Revenue": "Revenue",
  "nav.section.Operations": "Operations",
  "nav.section.System": "System",
  "nav.dashboard": "Dashboard",
  "nav.assistant": "AI Assistant",
  "nav.customers": "Customers",
  "nav.sales": "Sales",
  "nav.invoices": "Invoices",
  "nav.inventory": "Inventory",
  "nav.employees": "Employees",
  "nav.reports": "Reports",
  "nav.settings": "Settings",
  "shell.search": "Search customers, invoices, anything…",
  "shell.workspace": "Workspace",
  "shell.workspaceNote": "Architecture preview — modules unlock as we build.",
  "brand.tagline": "Business Operating System",
  "menu.profile": "Profile",
  "menu.settings": "Settings",
  "menu.signout": "Sign out",
  "landing.badge": "AI as your executive assistant",
  "landing.h1": "The operating system for your business",
  "landing.sub":
    "Run customers, sales, invoices, inventory and people from one elegant workspace, with an AI executive assistant that briefs you every morning.",
  "landing.start": "Start free",
  "landing.open": "Open dashboard",
  "landing.demo": "Book a walkthrough",
  "landing.signin": "Sign in",
  "landing.getstarted": "Get started",
  "landing.customers": "A CRM that remembers every conversation and nudges you first.",
  "landing.invoices": "Billing, payments and dunning that chase themselves.",
  "landing.inventory": "Stock levels, reorder points and supplier alerts in real time.",
  "landing.reports": "Financial clarity without a spreadsheet in sight.",
  "landing.rights": "All rights reserved.",
  "auth.welcome": "Welcome back",
  "auth.create": "Create your workspace",
  "auth.welcomeSub": "Sign in to continue running your business.",
  "auth.createSub": "Start in under a minute. No credit card required.",
  "auth.google": "Continue with Google",
  "auth.or": "or",
  "auth.fullName": "Full name",
  "auth.company": "Company",
  "auth.email": "Work email",
  "auth.password": "Password",
  "auth.signin": "Sign in",
  "auth.signup": "Create workspace",
  "auth.new": "New to Northstar OS?",
  "auth.have": "Already have an account?",
  "auth.createLink": "Create an account",
  "auth.error": "Something went wrong. Please try again.",
  "auth.googleError": "Google sign-in failed. Please try again.",
  "auth.heroTitle": "The operating system for your business.",
  "auth.heroCopy":
    "Customers, sales, invoices, inventory and people — unified, with an AI executive assistant that briefs you every morning.",
  "auth.heroFoot": "Trusted infrastructure for modern SMBs.",
};

const it: Dict = {
  "lang.title": "Scegli la tua lingua",
  "lang.subtitle": "Puoi cambiarla in qualsiasi momento dall'intestazione.",
  "lang.continue": "Continua",
  "lang.switch": "Lingua",
  "nav.section.Overview": "Panoramica",
  "nav.section.Revenue": "Ricavi",
  "nav.section.Operations": "Operazioni",
  "nav.section.System": "Sistema",
  "nav.dashboard": "Dashboard",
  "nav.assistant": "Assistente AI",
  "nav.customers": "Clienti",
  "nav.sales": "Vendite",
  "nav.invoices": "Fatture",
  "nav.inventory": "Magazzino",
  "nav.employees": "Dipendenti",
  "nav.reports": "Report",
  "nav.settings": "Impostazioni",
  "shell.search": "Cerca clienti, fatture, qualsiasi cosa…",
  "shell.workspace": "Area di lavoro",
  "shell.workspaceNote": "Anteprima architettura — i moduli si attivano man mano.",
  "brand.tagline": "Sistema operativo aziendale",
  "menu.profile": "Profilo",
  "menu.settings": "Impostazioni",
  "menu.signout": "Esci",
  "landing.badge": "L'AI come tuo assistente esecutivo",
  "landing.h1": "Il sistema operativo della tua azienda",
  "landing.sub":
    "Gestisci clienti, vendite, fatture, magazzino e persone da un unico spazio elegante, con un assistente AI che ogni mattina ti aggiorna.",
  "landing.start": "Inizia gratis",
  "landing.open": "Apri dashboard",
  "landing.demo": "Prenota una demo",
  "landing.signin": "Accedi",
  "landing.getstarted": "Inizia ora",
  "landing.customers": "Un CRM che ricorda ogni conversazione e ti avvisa per primo.",
  "landing.invoices": "Fatturazione, pagamenti e solleciti che si gestiscono da soli.",
  "landing.inventory": "Scorte, punti di riordino e avvisi fornitori in tempo reale.",
  "landing.reports": "Chiarezza finanziaria senza nemmeno un foglio di calcolo.",
  "landing.rights": "Tutti i diritti riservati.",
  "auth.welcome": "Bentornato",
  "auth.create": "Crea il tuo spazio di lavoro",
  "auth.welcomeSub": "Accedi per continuare a gestire la tua azienda.",
  "auth.createSub": "Pronto in meno di un minuto. Nessuna carta richiesta.",
  "auth.google": "Continua con Google",
  "auth.or": "oppure",
  "auth.fullName": "Nome completo",
  "auth.company": "Azienda",
  "auth.email": "Email aziendale",
  "auth.password": "Password",
  "auth.signin": "Accedi",
  "auth.signup": "Crea spazio di lavoro",
  "auth.new": "Nuovo su Northstar OS?",
  "auth.have": "Hai già un account?",
  "auth.createLink": "Crea un account",
  "auth.error": "Qualcosa è andato storto. Riprova.",
  "auth.googleError": "Accesso con Google non riuscito. Riprova.",
  "auth.heroTitle": "Il sistema operativo della tua azienda.",
  "auth.heroCopy":
    "Clienti, vendite, fatture, magazzino e persone — tutto unificato, con un assistente AI che ti aggiorna ogni mattina.",
  "auth.heroFoot": "Infrastruttura affidabile per le PMI moderne.",
};

const es: Dict = {
  ...en,
  "lang.title": "Elige tu idioma",
  "lang.subtitle": "Puedes cambiarlo cuando quieras desde la cabecera.",
  "lang.continue": "Continuar",
  "lang.switch": "Idioma",
  "nav.section.Overview": "Resumen",
  "nav.section.Revenue": "Ingresos",
  "nav.section.Operations": "Operaciones",
  "nav.section.System": "Sistema",
  "nav.assistant": "Asistente IA",
  "nav.customers": "Clientes",
  "nav.sales": "Ventas",
  "nav.invoices": "Facturas",
  "nav.inventory": "Inventario",
  "nav.employees": "Empleados",
  "nav.reports": "Informes",
  "nav.settings": "Ajustes",
  "shell.search": "Busca clientes, facturas, lo que sea…",
  "shell.workspace": "Espacio de trabajo",
  "brand.tagline": "Sistema operativo empresarial",
  "menu.profile": "Perfil",
  "menu.settings": "Ajustes",
  "menu.signout": "Cerrar sesión",
  "landing.badge": "La IA como tu asistente ejecutivo",
  "landing.h1": "El sistema operativo de tu empresa",
  "landing.sub":
    "Gestiona clientes, ventas, facturas, inventario y personas en un solo espacio elegante, con un asistente de IA que te informa cada mañana.",
  "landing.start": "Empieza gratis",
  "landing.open": "Abrir panel",
  "landing.demo": "Reservar una demo",
  "landing.signin": "Iniciar sesión",
  "landing.getstarted": "Comenzar",
  "landing.rights": "Todos los derechos reservados.",
  "auth.welcome": "Bienvenido de nuevo",
  "auth.create": "Crea tu espacio de trabajo",
  "auth.google": "Continuar con Google",
  "auth.or": "o",
  "auth.fullName": "Nombre completo",
  "auth.company": "Empresa",
  "auth.email": "Email de trabajo",
  "auth.signin": "Iniciar sesión",
  "auth.signup": "Crear espacio",
  "auth.have": "¿Ya tienes cuenta?",
  "auth.createLink": "Crear una cuenta",
};

const fr: Dict = {
  ...en,
  "lang.title": "Choisissez votre langue",
  "lang.subtitle": "Vous pouvez la changer à tout moment depuis l'en-tête.",
  "lang.continue": "Continuer",
  "lang.switch": "Langue",
  "nav.section.Overview": "Aperçu",
  "nav.section.Revenue": "Revenus",
  "nav.section.Operations": "Opérations",
  "nav.section.System": "Système",
  "nav.assistant": "Assistant IA",
  "nav.customers": "Clients",
  "nav.sales": "Ventes",
  "nav.invoices": "Factures",
  "nav.inventory": "Stock",
  "nav.employees": "Employés",
  "nav.reports": "Rapports",
  "nav.settings": "Paramètres",
  "shell.search": "Rechercher clients, factures, tout…",
  "shell.workspace": "Espace de travail",
  "brand.tagline": "Système d'exploitation d'entreprise",
  "menu.profile": "Profil",
  "menu.settings": "Paramètres",
  "menu.signout": "Se déconnecter",
  "landing.badge": "L'IA comme assistant de direction",
  "landing.h1": "Le système d'exploitation de votre entreprise",
  "landing.sub":
    "Pilotez clients, ventes, factures, stock et équipes depuis un espace élégant, avec un assistant IA qui vous informe chaque matin.",
  "landing.start": "Commencer gratuitement",
  "landing.open": "Ouvrir le tableau de bord",
  "landing.demo": "Réserver une démo",
  "landing.signin": "Se connecter",
  "landing.getstarted": "Commencer",
  "landing.rights": "Tous droits réservés.",
  "auth.welcome": "Bon retour",
  "auth.create": "Créez votre espace de travail",
  "auth.google": "Continuer avec Google",
  "auth.or": "ou",
  "auth.fullName": "Nom complet",
  "auth.company": "Entreprise",
  "auth.email": "Email professionnel",
  "auth.signin": "Se connecter",
  "auth.signup": "Créer l'espace",
  "auth.have": "Vous avez déjà un compte ?",
  "auth.createLink": "Créer un compte",
};

const base: Record<LanguageCode, Dict> = { en, it, es, fr };

const dictionaries: Record<LanguageCode, Dict> = {
  en: { ...base.en, ...extraDict("en") },
  it: { ...base.it, ...extraDict("it") },
  es: { ...base.es, ...extraDict("es") },
  fr: { ...base.fr, ...extraDict("fr") },
};

type I18nValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
  chosen: boolean;
  ready: boolean;
};

const fallbackValue: I18nValue = {
  language: "en",
  setLanguage: () => {},
  t: (key: string) => en[key] ?? key,
  chosen: true,
  ready: false,
};

const I18nContext = createContext<I18nValue>(fallbackValue);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [chosen, setChosen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && stored in dictionaries) {
      setLanguageState(stored);
      setChosen(true);
    } else {
      const browser = window.navigator.language.slice(0, 2) as LanguageCode;
      setLanguageState(browser in dictionaries ? browser : "en");
      setChosen(false);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    setFormatLocale(language);
    if (ready) document.documentElement.lang = language;
  }, [language, ready]);

  const setLanguage = useCallback((code: LanguageCode) => {
    window.localStorage.setItem(STORAGE_KEY, code);
    setLanguageState(code);
    setChosen(true);
  }, []);

  const t = useCallback(
    (key: string) => dictionaries[language][key] ?? dictionaries.en[key] ?? key,
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, chosen, ready }),
    [language, setLanguage, t, chosen, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
