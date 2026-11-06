export const DAILY_PRAYER_SCALE = {
  min: 0.85,
  max: 1.45,
  step: 0.1,
  default: 1,
};

export function adjustPrayerFontScale(
  current = DAILY_PRAYER_SCALE.default,
  delta = 0,
) {
  const next = Math.round((Number(current) + Number(delta)) * 100) / 100;
  return Math.max(
    DAILY_PRAYER_SCALE.min,
    Math.min(DAILY_PRAYER_SCALE.max, next),
  );
}

export function formatPrayerTextForShare(prayer) {
  if (!prayer) return "";
  const body = Array.isArray(prayer.paragraphs)
    ? prayer.paragraphs.join("\n\n")
    : "";
  return `${prayer.title}\n\n${body}`.trim();
}

export async function copyPrayerText(
  prayer,
  nav = typeof navigator !== "undefined" ? navigator : null,
) {
  const text = formatPrayerTextForShare(prayer);
  if (!text) return { ok: false, method: "none", text: "" };

  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
    return { ok: true, method: "clipboard", text };
  }

  return { ok: false, method: "unavailable", text };
}

export async function sharePrayerText(
  prayer,
  url = "",
  nav = typeof navigator !== "undefined" ? navigator : null,
) {
  const text = formatPrayerTextForShare(prayer);
  if (!text) return { ok: false, method: "none" };

  if (typeof nav?.share === "function") {
    await nav.share({
      title: prayer.title,
      text,
      ...(url ? { url } : {}),
    });
    return { ok: true, method: "web-share", text };
  }

  const copied = await copyPrayerText(prayer, nav);
  if (copied.ok) {
    return { ok: true, method: "clipboard-fallback", text };
  }

  return { ok: false, method: "unavailable", text };
}

export const DAILY_PRAYER_CARDS = [
  {
    number: "01",
    slug: "espirito-santo",
    href: "/oratorio/oracoes/espirito-santo",
    title: "Espírito Santo",
    description:
      "Busque iluminação, sabedoria e discernimento na presença do Espírito Santo.",
    complement: "2 orações",
    cta: "Abrir orações",
    icon: "leaf",
  },
  {
    number: "02",
    slug: "oracao-da-manha",
    href: "/oratorio/oracoes/oracao-da-manha",
    title: "Oração da Manhã",
    description:
      "Entregue seus pensamentos, trabalhos e decisões a Deus no início de cada dia.",
    complement: "Oferecimento do dia",
    cta: "Ler oração",
    icon: "sun",
  },
  {
    number: "03",
    slug: "oracao-da-noite",
    href: "/oratorio/oracoes/oracao-da-noite",
    title: "Oração da Noite",
    description:
      "Agradeça pelo dia, peça perdão e entregue seu descanso nas mãos de Deus.",
    complement: "Oração antes de dormir",
    cta: "Ler oração",
    icon: "candle",
  },
];

export const DAILY_PRAYERS = {
  "espirito-santo": {
    slug: "espirito-santo",
    href: "/oratorio/oracoes/espirito-santo",
    breadcrumbTitle: "Espírito Santo",
    category: "ORAÇÕES DO DIA A DIA",
    title: "Espírito Santo",
    subtitle:
      "Busque iluminação, sabedoria e discernimento na presença do Espírito Santo.",
    seoTitle: "Espírito Santo — Orações do Dia a Dia | PanteraLab",
    seoDescription:
      "Reze a oração tradicional Vinde, Espírito Santo e a oração pessoal ao Espírito Santo no Oratório do Caminhar para Cristo.",
    prayers: [
      {
        id: "vinde-espirito-santo",
        title: "Vinde, Espírito Santo",
        badge: "ORAÇÃO TRADICIONAL",
        presentation:
          "Invocação tradicional para pedir a luz e o consolo do Espírito Santo.",
        paragraphs: [
          "Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor.",
          "Enviai o vosso Espírito e tudo será criado, e renovareis a face da terra.",
          "Oremos:",
          "Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, concedei-nos que, no mesmo Espírito, saibamos o que é reto e gozemos sempre de sua consolação. Por Cristo, nosso Senhor. Amém.",
        ],
      },
      {
        id: "oracao-pessoal-espirito-santo",
        title: "Oração pessoal ao Espírito Santo",
        badge: "ORAÇÃO DEVOCIONAL",
        presentation:
          "Oração devocional para pedir sabedoria, humildade e fidelidade à vontade de Deus.",
        paragraphs: [
          "Espírito Santo de Deus, iluminai minha mente, fortalecei meu coração e conduzi meus passos.",
          "Afastai de mim tudo aquilo que me distancia da verdade e do amor. Dai-me sabedoria para escolher o bem, humildade para reconhecer meus erros e coragem para cumprir a vontade de Deus.",
          "Que minhas palavras transmitam bondade, minhas atitudes revelem fé e minha vida seja guiada pela presença de Deus. Amém.",
        ],
      },
    ],
  },
  "oracao-da-manha": {
    slug: "oracao-da-manha",
    href: "/oratorio/oracoes/oracao-da-manha",
    breadcrumbTitle: "Oração da Manhã",
    category: "ORAÇÕES DO DIA A DIA",
    title: "Oração da Manhã",
    subtitle: "Oferecimento do dia",
    seoTitle: "Oração da Manhã — Oferecimento do dia | PanteraLab",
    seoDescription:
      "Entregue seus pensamentos, trabalhos e decisões a Deus no início de cada dia com a Oração da Manhã no Oratório.",
    prayers: [
      {
        id: "oracao-da-manha",
        title: "Oração da Manhã",
        badge: "OFERECIMENTO DO DIA",
        presentation:
          "Entregue seus pensamentos, trabalhos e decisões a Deus no início de cada dia.",
        paragraphs: [
          "Senhor meu Deus e meu Pai, agradeço por este novo dia e pelo dom da vida.",
          "Entrego-Vos meus pensamentos, minhas palavras, minhas ações, meus trabalhos e todas as decisões que tomarei hoje.",
          "Conduzi meus passos pelo caminho da verdade. Dai-me paciência diante das dificuldades, humildade diante dos meus erros e sabedoria para reconhecer aquilo que é bom.",
          "Abençoai minha família, protegei aqueles que amo e olhai por todos os que sofrem.",
          "Que eu não seja instrumento de discórdia, mas de paz; não de julgamento, mas de compreensão; não de orgulho, mas de humildade.",
          "Que minhas atitudes sejam coerentes com os ensinamentos de Jesus Cristo.",
          "Senhor, que este dia seja vivido na Vossa presença e conforme a Vossa vontade.",
          "Em nome de Jesus Cristo. Amém.",
        ],
      },
    ],
  },
  "oracao-da-noite": {
    slug: "oracao-da-noite",
    href: "/oratorio/oracoes/oracao-da-noite",
    breadcrumbTitle: "Oração da Noite",
    category: "ORAÇÕES DO DIA A DIA",
    title: "Oração da Noite",
    subtitle: "Oração antes de dormir",
    seoTitle: "Oração da Noite — Oração antes de dormir | PanteraLab",
    seoDescription:
      "Agradeça pelo dia, peça perdão e entregue seu descanso nas mãos de Deus com a Oração da Noite no Oratório.",
    prayers: [
      {
        id: "oracao-da-noite",
        title: "Oração da Noite",
        badge: "ORAÇÃO ANTES DE DORMIR",
        presentation:
          "Agradeça pelo dia, peça perdão e entregue seu descanso nas mãos de Deus.",
        paragraphs: [
          "Senhor meu Deus, ao terminar este dia, coloco minha vida diante de Vós.",
          "Agradeço pelas bênçãos recebidas, pelas oportunidades, pelas pessoas que encontrei e até pelas dificuldades que me ensinaram a crescer.",
          "Perdoai minhas falhas, minhas palavras impensadas, minhas atitudes egoístas e todas as vezes em que deixei de praticar o bem.",
          "Purificai meu coração de toda mágoa, ressentimento, inveja e preocupação.",
          "Entrego-Vos minha família, meus amigos, aqueles que estão sofrendo e também aqueles com quem tenho dificuldades de convivência.",
          "Concedei-me uma noite tranquila, protegei meu descanso e renovai minhas forças para o dia que virá.",
          "Que eu nunca me afaste do Vosso amor e que minha vida permaneça sob a luz de Jesus Cristo.",
          "Em nome do Pai, do Filho e do Espírito Santo. Amém.",
        ],
      },
    ],
  },
};
