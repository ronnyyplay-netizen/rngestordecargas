export const COLOR_THEMES = [
  { id: "default", name: "Padrão (Azul)" },
  { id: "emerald", name: "Esmeralda" },
  { id: "violet", name: "Violeta" },
  { id: "rose", name: "Rosa" },
  { id: "slate", name: "Grafite" },
] as const;

export type ColorTheme = typeof COLOR_THEMES[number]["id"];

const THEME_CLASSES = ["theme-emerald", "theme-violet", "theme-rose", "theme-slate"];

export function applyColorTheme(theme: ColorTheme) {
  const root = document.documentElement;
  THEME_CLASSES.forEach((c) => root.classList.remove(c));
  if (theme !== "default") root.classList.add(`theme-${theme}`);
  localStorage.setItem("color-theme", theme);
}

export function getStoredColorTheme(): ColorTheme {
  return (localStorage.getItem("color-theme") as ColorTheme) || "default";
}
