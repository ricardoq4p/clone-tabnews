import { DEFAULT_CONTENT } from "./content";
export function brasiliaDay(date = new Date()) {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}
export function mysteriesForDay(date = new Date(), content = DEFAULT_CONTENT) {
  return content.sets.find((set) => set.days.includes(brasiliaDay(date)));
}
export function buildRosary(
  setId,
  { full = false, fatima = true } = {},
  content = DEFAULT_CONTENT,
) {
  const selected = content.sets.find((set) => set.id === setId);
  if (!selected) throw new Error("Conjunto de mistérios inválido");
  const steps = [];
  const add = (prayer, detail = {}) =>
    steps.push({
      id: `${steps.length}-${prayer}`,
      prayer,
      ...content.prayers[prayer],
      ...detail,
    });
  add("sinal");
  add("oferecimento");
  add("credo");
  add("pai", { label: "Orações iniciais" });
  for (let i = 1; i <= 3; i++)
    add("ave", {
      bead: i,
      label: ["Pela fé", "Pela esperança", "Pela caridade"][i - 1],
    });
  add("gloria");
  const sets = full ? content.sets : [selected];
  for (const set of sets)
    for (const [index, mystery] of set.mysteries.entries()) {
      const context = {
        mystery,
        mysteryIndex: index,
        setId: set.id,
        setTitle: set.title,
      };
      steps.push({
        id: `${steps.length}-misterio`,
        prayer: "contemplacao",
        title: mystery.title,
        text: mystery.meditation,
        ...context,
      });
      add("pai", context);
      for (let bead = 1; bead <= 10; bead++)
        add("ave", {
          ...context,
          bead,
          label: `${bead}ª Ave-Maria · ${index + 1}º mistério`,
        });
      add("gloria", context);
      if (fatima) add("fatima", context);
    }
  add("agradecimento");
  add("salve");
  add("final");
  add("sinal");
  return steps;
}
export function validProgress(value, content = DEFAULT_CONTENT) {
  if (
    !Array.isArray(content?.sets) ||
    !content?.prayers ||
    !value ||
    !content.sets.some((set) => set.id === value.setId) ||
    value.version !== content.version ||
    typeof value.full !== "boolean" ||
    typeof value.fatima !== "boolean" ||
    !Number.isInteger(value.position) ||
    value.position < 0
  )
    return false;
  return value.position <= buildRosary(value.setId, value, content).length;
}
export function newProgress(setId, options = {}, content = DEFAULT_CONTENT) {
  return {
    version: content.version,
    setId,
    full: options.full === true,
    fatima: options.fatima !== false,
    position: 0,
    updatedAt: new Date().toISOString(),
  };
}
