export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  driverId: string;
  isBoleto?: boolean;
  boletoFile?: string;
}

export interface Revenue {
  id: string;
  description: string;
  amount: number;
  date: string;
  driverId: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  truck: string;
}

export interface AppSettings {
  companyName: string;
  logoUrl: string;
}

const DEFAULT_DRIVERS: Driver[] = [
  { id: "driver-1", name: "Motorista 1", phone: "5511999999999", truck: "Caminhão 1" },
  { id: "driver-2", name: "Motorista 2", phone: "5511888888888", truck: "Caminhão 2" },
  { id: "driver-3", name: "Motorista 3", phone: "5511777777777", truck: "Caminhão 3" },
];

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "Minha Empresa",
  logoUrl: "",
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getDrivers: (): Driver[] => getItem("gt_drivers", DEFAULT_DRIVERS),
  setDrivers: (d: Driver[]) => setItem("gt_drivers", d),

  getExpenses: (): Expense[] => getItem("gt_expenses", []),
  setExpenses: (e: Expense[]) => setItem("gt_expenses", e),
  addExpense: (e: Expense) => {
    const all = store.getExpenses();
    all.push(e);
    store.setExpenses(all);
  },
  removeExpense: (id: string) => {
    store.setExpenses(store.getExpenses().filter((e) => e.id !== id));
  },
  updateExpense: (e: Expense) => {
    store.setExpenses(store.getExpenses().map((x) => (x.id === e.id ? e : x)));
  },

  getRevenues: (): Revenue[] => getItem("gt_revenues", []),
  setRevenues: (r: Revenue[]) => setItem("gt_revenues", r),
  addRevenue: (r: Revenue) => {
    const all = store.getRevenues();
    all.push(r);
    store.setRevenues(all);
  },
  removeRevenue: (id: string) => {
    store.setRevenues(store.getRevenues().filter((r) => r.id !== id));
  },

  getSettings: (): AppSettings => getItem("gt_settings", DEFAULT_SETTINGS),
  setSettings: (s: AppSettings) => setItem("gt_settings", s),
};
