import { DEFAULT_MERCY_CONTENT } from "./content";

export function buildMercyChaplet(
  { closingPrayer = true } = {},
  content = DEFAULT_MERCY_CONTENT,
) {
  if (!content?.prayers || !Array.isArray(content?.decades)) {
    throw new Error("Conteúdo do Terço da Misericórdia inválido");
  }
  const steps = [];
  const add = (prayer, detail = {}) => {
    const base = content.prayers[prayer];
    if (!base) throw new Error(`Oração desconhecida: ${prayer}`);
    steps.push({
      id: `${steps.length}-${prayer}`,
      index: steps.length,
      prayer,
      ...base,
      ...detail,
    });
  };

  add("sinal", {
    stage: "initial",
    stageTitle: "Orações iniciais",
    label: "Início da oração",
  });
  add("pai", {
    stage: "initial",
    stageTitle: "Orações iniciais",
    label: "Orações iniciais",
  });
  add("ave", {
    stage: "initial",
    stageTitle: "Orações iniciais",
    label: "Orações iniciais",
  });
  add("credo", {
    stage: "initial",
    stageTitle: "Orações iniciais",
    label: "Profissão de fé",
  });

  for (const [decadeIndex, decade] of content.decades.entries()) {
    const decadeNumber = decadeIndex + 1;
    const context = {
      stage: "decade",
      stageTitle: `${decadeNumber}ª Dezena`,
      decadeIndex,
      decadeNumber,
      decadeTitle: decade.title,
      decadeIntention: decade.intention,
    };
    add("eterno-pai", {
      ...context,
      beadType: "large",
      label: `Conta grande · ${decadeNumber}ª dezena`,
    });
    for (let bead = 1; bead <= 10; bead++) {
      add("dolorosa-paixao", {
        ...context,
        beadType: "small",
        bead,
        beadTotal: 10,
        label: `${bead}ª invocação de 10 · ${decadeNumber}ª dezena`,
      });
    }
  }

  for (let bead = 1; bead <= 3; bead++) {
    add("deus-santo", {
      stage: "trisagion",
      stageTitle: "Invocação final",
      bead,
      beadTotal: 3,
      label: `${bead}ª invocação final de 3`,
    });
  }

  if (closingPrayer !== false) {
    add("oracao-conclusiva", {
      stage: "closing",
      stageTitle: "Oração conclusiva (opcional)",
      optional: true,
      label: "Oração conclusiva opcional",
    });
  }

  return steps;
}

export function buildMercySections(steps) {
  const sections = [
    {
      id: "initial",
      title: "Orações iniciais",
      subtitle: "Sinal da Cruz, Pai-Nosso, Ave-Maria e Credo",
      startIndex: 0,
      endIndex: 3,
    },
  ];
  for (let d = 0; d < 5; d++) {
    const startIndex = 4 + d * 11;
    sections.push({
      id: `decade-${d + 1}`,
      title: `${d + 1}ª Dezena`,
      subtitle: "Eterno Pai + 10 invocações da Dolorosa Paixão",
      startIndex,
      endIndex: startIndex + 10,
      decadeIndex: d,
    });
  }
  sections.push({
    id: "trisagion",
    title: "Invocação final (3×)",
    subtitle: "Deus Santo, Deus Forte, Deus Imortal",
    startIndex: 59,
    endIndex: 61,
  });
  if (steps.length > 62) {
    sections.push({
      id: "closing",
      title: "Oração conclusiva",
      subtitle: "Opcional",
      optional: true,
      startIndex: 62,
      endIndex: 62,
    });
  }
  return sections;
}

export function validMercyProgress(value, content = DEFAULT_MERCY_CONTENT) {
  if (
    !value ||
    typeof value !== "object" ||
    value.version !== content.version ||
    typeof value.closingPrayer !== "boolean" ||
    !Number.isInteger(value.position) ||
    value.position < 0
  ) {
    return false;
  }
  const steps = buildMercyChaplet(
    { closingPrayer: value.closingPrayer },
    content,
  );
  return value.position <= steps.length;
}

export function newMercyProgress(
  { closingPrayer = true } = {},
  content = DEFAULT_MERCY_CONTENT,
) {
  return {
    version: content.version,
    closingPrayer: closingPrayer !== false,
    position: 0,
    updatedAt: new Date().toISOString(),
  };
}
