export const DEFAULT_CATEGORIES: { name: string; icon: string }[] = [
  { name: "Alimentação", icon: "UtensilsCrossed" },
  { name: "Transporte", icon: "Car" },
  { name: "Lazer", icon: "Clapperboard" },
  { name: "Compras", icon: "ShoppingBag" },
  { name: "Saúde", icon: "Pill" },
  { name: "Educação", icon: "GraduationCap" },
  { name: "Contas", icon: "FileText" },
  { name: "Despesas Fixas", icon: "Repeat" },
  { name: "Eletrônicos", icon: "Laptop" },
  { name: "Viagem", icon: "Plane" },
  { name: "Outros", icon: "Package" },
];

export const PROTECTED_CATEGORY_NAME = "Outros";

export const PROTECTED_CATEGORY_ICON = "Package";

export const FIXED_EXPENSE_CATEGORY = { name: "Despesas Fixas", icon: "Repeat" };

export const AI_SUGGESTABLE_CATEGORIES = DEFAULT_CATEGORIES.filter(
  (category) => category.name !== FIXED_EXPENSE_CATEGORY.name,
).map((category) => category.name);
