function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractQuantity(text, pattern) {
  const quantityMatch = text.match(new RegExp(`(\\d+)\\s*${pattern.source}`, "i"));
  if (!quantityMatch) return 1;

  const quantity = Number(quantityMatch[1]);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

const comboEstimates = [
  {
    pattern: /pao com ovo/,
    label: "Pao com ovo",
    calories: 260,
  },
  {
    pattern: /arroz com feijao/,
    label: "Arroz com feijao",
    calories: 220,
  },
  {
    pattern: /prato feito/,
    label: "Prato feito simples",
    calories: 650,
  },
  {
    pattern: /cafe com leite/,
    label: "Cafe com leite",
    calories: 80,
  },
  {
    pattern: /hamburguer/,
    label: "Hamburguer",
    calories: 520,
  },
  {
    pattern: /pizza/,
    label: "Pizza (2 fatias)",
    calories: 540,
  },
];

const ingredientEstimates = [
  { pattern: /pao frances/, label: "Pao frances", calories: 140 },
  { pattern: /pao/, label: "Pao", calories: 140 },
  { pattern: /ovo/, label: "Ovo", calories: 78, supportsQuantity: true },
  { pattern: /banana/, label: "Banana", calories: 90, supportsQuantity: true },
  { pattern: /maca/, label: "Maca", calories: 80, supportsQuantity: true },
  { pattern: /cafe/, label: "Cafe", calories: 5 },
  { pattern: /leite/, label: "Leite", calories: 60 },
  { pattern: /arroz/, label: "Arroz", calories: 130 },
  { pattern: /feijao/, label: "Feijao", calories: 90 },
  { pattern: /frango/, label: "Frango", calories: 160 },
  { pattern: /carne/, label: "Carne", calories: 220 },
  { pattern: /salada/, label: "Salada", calories: 35 },
  { pattern: /queijo/, label: "Queijo", calories: 90 },
  { pattern: /iogurte/, label: "Iogurte", calories: 120 },
  { pattern: /macarrao/, label: "Macarrao", calories: 220 },
  { pattern: /bolo/, label: "Bolo", calories: 280 },
  { pattern: /biscoito/, label: "Biscoito", calories: 160 },
  { pattern: /refrigerante/, label: "Refrigerante", calories: 140 },
  { pattern: /suco/, label: "Suco", calories: 110 },
  { pattern: /chocolate/, label: "Chocolate", calories: 160 },
];

export function estimateCaloriesFromText(description = "") {
  const originalText = description.trim();
  const normalizedDescription = normalizeText(description);

  if (!normalizedDescription) {
    return {
      description: originalText,
      estimatedCalories: 0,
      matchedItems: [],
      note: "Descreva uma refeicao para receber uma estimativa.",
    };
  }

  const matchedItems = [];
  let workingText = normalizedDescription;
  let totalCalories = 0;

  comboEstimates.forEach((item) => {
    if (item.pattern.test(workingText)) {
      totalCalories += item.calories;
      matchedItems.push(`${item.label} (${item.calories} kcal)`);
      workingText = workingText.replace(item.pattern, " ");
    }
  });

  ingredientEstimates.forEach((item) => {
    if (item.pattern.test(workingText)) {
      const quantity = item.supportsQuantity ? extractQuantity(workingText, item.pattern) : 1;
      const calories = item.calories * quantity;
      totalCalories += calories;
      matchedItems.push(`${item.label}${quantity > 1 ? ` x${quantity}` : ""} (${calories} kcal)`);
      workingText = workingText.replace(item.pattern, " ");
    }
  });

  if (matchedItems.length === 0) {
    return {
      description: originalText,
      estimatedCalories: 220,
      matchedItems: ["Estimativa geral de refeicao simples (220 kcal)"],
      note: "Nao encontrei um alimento especifico. Usei uma estimativa generica para manter o contador funcionando.",
    };
  }

  return {
    description: originalText,
    estimatedCalories: totalCalories,
    matchedItems,
    note: "Estimativa baseada em porcoes comuns de alimentos do dia a dia. Pode variar conforme preparo e quantidade.",
  };
}
