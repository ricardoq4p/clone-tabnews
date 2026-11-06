import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseRouter = jest.fn();
const mockUseSession = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter(),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));

jest.mock("next/font/local", () => () => ({
  variable: "mock-font-var",
}));

jest.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }) =>
    React.createElement("div", { "data-testid": "next-head" }, children),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) =>
    React.createElement("img", {
      src: props.src,
      alt: props.alt || "",
      width: props.width,
      height: props.height,
    }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, className, "aria-current": ariaCurrent, children }) =>
    React.createElement(
      "a",
      { href, className, "aria-current": ariaCurrent },
      children,
    ),
}));

import Oratorio, {
  ORATORIO_EXPERIENCES,
  DAILY_PRAYER_CARDS,
} from "../pages/oratorio";
import EspiritoSantoPage from "../pages/oratorio/oracoes/espirito-santo";
import OracaoDaManhaPage from "../pages/oratorio/oracoes/oracao-da-manha";
import OracaoDaNoitePage from "../pages/oratorio/oracoes/oracao-da-noite";
import {
  DAILY_PRAYERS,
  DAILY_PRAYER_SCALE,
  adjustPrayerFontScale,
  formatPrayerTextForShare,
  copyPrayerText,
  sharePrayerText,
} from "../lib/oratorio/daily-prayers";

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
  mockUseRouter.mockReturnValue({
    pathname: "/oratorio",
    asPath: "/oratorio",
    query: {},
  });
});

describe("Oratório — Seção Orações do Dia a Dia e preservação das devoções", () => {
  test("exibe a seção Orações do Dia a Dia com os três cards e preserva Santo Rosário e Terço da Misericórdia", () => {
    expect(ORATORIO_EXPERIENCES).toHaveLength(2);
    expect(DAILY_PRAYER_CARDS).toEqual([
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
    ]);

    const html = renderToStaticMarkup(React.createElement(Oratorio));

    // Preservação das devoções principais
    expect(html).toContain("Santo Rosário");
    expect(html).toContain('href="/rosario"');
    expect(html).toContain("Terço da Misericórdia");
    expect(html).toContain('href="/terco-da-misericordia"');

    // Nova seção Orações do Dia a Dia
    expect(html).toContain("Orações do Dia a Dia");
    expect(html).toContain("Uma oração para cada momento.");
    expect(html).toContain(
      "Nem toda oração precisa ser longa. Às vezes, poucas palavras ditas com fé aproximam nosso coração de Deus.",
    );

    // Card 01 — Espírito Santo
    expect(html).toContain("Espírito Santo");
    expect(html).toContain(
      "Busque iluminação, sabedoria e discernimento na presença do Espírito Santo.",
    );
    expect(html).toContain("2 orações");
    expect(html).toContain('href="/oratorio/oracoes/espirito-santo"');

    // Card 02 — Oração da Manhã
    expect(html).toContain("Oração da Manhã");
    expect(html).toContain(
      "Entregue seus pensamentos, trabalhos e decisões a Deus no início de cada dia.",
    );
    expect(html).toContain('href="/oratorio/oracoes/oracao-da-manha"');

    // Card 03 — Oração da Noite
    expect(html).toContain("Oração da Noite");
    expect(html).toContain(
      "Agradeça pelo dia, peça perdão e entregue seu descanso nas mãos de Deus.",
    );
    expect(html).toContain('href="/oratorio/oracoes/oracao-da-noite"');
  });
});

describe("Páginas individuais de oração — Conteúdo completo, Breadcrumbs e SEO", () => {
  test("renderiza /oratorio/oracoes/espirito-santo com metadados SEO, breadcrumb e as duas orações completas", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/oratorio/oracoes/espirito-santo",
      asPath: "/oratorio/oracoes/espirito-santo",
      query: {},
    });

    const html = renderToStaticMarkup(React.createElement(EspiritoSantoPage));

    // SEO
    expect(html).toContain(
      "<title>Espírito Santo — Orações do Dia a Dia | PanteraLab</title>",
    );
    expect(html).toContain(
      'content="Reze a oração tradicional Vinde, Espírito Santo e a oração pessoal ao Espírito Santo no Oratório do Caminhar para Cristo."',
    );

    // Breadcrumb e navegação ativa no Oratório
    expect(html).toContain(
      '<div class="p-breadcrumb"><a href="/">Início</a><span>/</span><a href="/oratorio">Oratório</a><span>/</span><a href="/oratorio#oracoes-do-dia-a-dia">Orações</a><span>/</span>Espírito Santo</div>',
    );
    expect(html).toContain('href="/oratorio" aria-current="page"');

    // Cabeçalho da página
    expect(html).toContain("ORAÇÕES DO DIA A DIA");
    expect(html).toContain("<h1>Espírito Santo</h1>");
    expect(html).toContain(
      "Busque iluminação, sabedoria e discernimento na presença do Espírito Santo.",
    );

    // Opção 1 — Vinde, Espírito Santo (Oração tradicional)
    expect(html).toContain("Vinde, Espírito Santo");
    expect(html).toContain("ORAÇÃO TRADICIONAL");
    expect(html).toContain(
      "Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor.",
    );
    expect(html).toContain(
      "Enviai o vosso Espírito e tudo será criado, e renovareis a face da terra.",
    );
    expect(html).toContain("Oremos:");
    expect(html).toContain(
      "Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, concedei-nos que, no mesmo Espírito, saibamos o que é reto e gozemos sempre de sua consolação. Por Cristo, nosso Senhor. Amém.",
    );

    // Opção 2 — Oração pessoal ao Espírito Santo (Oração devocional)
    expect(html).toContain("Oração pessoal ao Espírito Santo");
    expect(html).toContain("ORAÇÃO DEVOCIONAL");
    expect(html).toContain(
      "Espírito Santo de Deus, iluminai minha mente, fortalecei meu coração e conduzi meus passos.",
    );
    expect(html).toContain(
      "Afastai de mim tudo aquilo que me distancia da verdade e do amor. Dai-me sabedoria para escolher o bem, humildade para reconhecer meus erros e coragem para cumprir a vontade de Deus.",
    );
    expect(html).toContain(
      "Que minhas palavras transmitam bondade, minhas atitudes revelem fé e minha vida seja guiada pela presença de Deus. Amém.",
    );

    // Controles de leitura, ações e retorno
    expect(html).toContain("A-");
    expect(html).toContain("A+");
    expect(html).toContain("Copiar oração");
    expect(html).toContain("Compartilhar");
    expect(html).toContain("Voltar ao Oratório");
  });

  test("renderiza /oratorio/oracoes/oracao-da-manha com metadados SEO, breadcrumb e texto completo", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/oratorio/oracoes/oracao-da-manha",
      asPath: "/oratorio/oracoes/oracao-da-manha",
      query: {},
    });

    const html = renderToStaticMarkup(React.createElement(OracaoDaManhaPage));

    // SEO
    expect(html).toContain(
      "<title>Oração da Manhã — Oferecimento do dia | PanteraLab</title>",
    );
    expect(html).toContain(
      'content="Entregue seus pensamentos, trabalhos e decisões a Deus no início de cada dia com a Oração da Manhã no Oratório."',
    );

    // Breadcrumb
    expect(html).toContain(
      '<div class="p-breadcrumb"><a href="/">Início</a><span>/</span><a href="/oratorio">Oratório</a><span>/</span><a href="/oratorio#oracoes-do-dia-a-dia">Orações</a><span>/</span>Oração da Manhã</div>',
    );

    // Conteúdo completo da Oração da Manhã
    expect(html).toContain("<h1>Oração da Manhã</h1>");
    expect(html).toContain("Oferecimento do dia");
    expect(html).toContain(
      "Senhor meu Deus e meu Pai, agradeço por este novo dia e pelo dom da vida.",
    );
    expect(html).toContain(
      "Entrego-Vos meus pensamentos, minhas palavras, minhas ações, meus trabalhos e todas as decisões que tomarei hoje.",
    );
    expect(html).toContain(
      "Conduzi meus passos pelo caminho da verdade. Dai-me paciência diante das dificuldades, humildade diante dos meus erros e sabedoria para reconhecer aquilo que é bom.",
    );
    expect(html).toContain(
      "Abençoai minha família, protegei aqueles que amo e olhai por todos os que sofrem.",
    );
    expect(html).toContain(
      "Que eu não seja instrumento de discórdia, mas de paz; não de julgamento, mas de compreensão; não de orgulho, mas de humildade.",
    );
    expect(html).toContain(
      "Que minhas atitudes sejam coerentes com os ensinamentos de Jesus Cristo.",
    );
    expect(html).toContain(
      "Senhor, que este dia seja vivido na Vossa presença e conforme a Vossa vontade.",
    );
    expect(html).toContain("Em nome de Jesus Cristo. Amém.");
    expect(html).toContain("Voltar ao Oratório");
  });

  test("renderiza /oratorio/oracoes/oracao-da-noite com metadados SEO, breadcrumb e texto completo", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/oratorio/oracoes/oracao-da-noite",
      asPath: "/oratorio/oracoes/oracao-da-noite",
      query: {},
    });

    const html = renderToStaticMarkup(React.createElement(OracaoDaNoitePage));

    // SEO
    expect(html).toContain(
      "<title>Oração da Noite — Oração antes de dormir | PanteraLab</title>",
    );
    expect(html).toContain(
      'content="Agradeça pelo dia, peça perdão e entregue seu descanso nas mãos de Deus com a Oração da Noite no Oratório."',
    );

    // Breadcrumb
    expect(html).toContain(
      '<div class="p-breadcrumb"><a href="/">Início</a><span>/</span><a href="/oratorio">Oratório</a><span>/</span><a href="/oratorio#oracoes-do-dia-a-dia">Orações</a><span>/</span>Oração da Noite</div>',
    );

    // Conteúdo completo da Oração da Noite
    expect(html).toContain("<h1>Oração da Noite</h1>");
    expect(html).toContain("Oração antes de dormir");
    expect(html).toContain(
      "Senhor meu Deus, ao terminar este dia, coloco minha vida diante de Vós.",
    );
    expect(html).toContain(
      "Agradeço pelas bênçãos recebidas, pelas oportunidades, pelas pessoas que encontrei e até pelas dificuldades que me ensinaram a crescer.",
    );
    expect(html).toContain(
      "Perdoai minhas falhas, minhas palavras impensadas, minhas atitudes egoístas e todas as vezes em que deixei de praticar o bem.",
    );
    expect(html).toContain(
      "Purificai meu coração de toda mágoa, ressentimento, inveja e preocupação.",
    );
    expect(html).toContain(
      "Entrego-Vos minha família, meus amigos, aqueles que estão sofrendo e também aqueles com quem tenho dificuldades de convivência.",
    );
    expect(html).toContain(
      "Concedei-me uma noite tranquila, protegei meu descanso e renovai minhas forças para o dia que virá.",
    );
    expect(html).toContain(
      "Que eu nunca me afaste do Vosso amor e que minha vida permaneça sob a luz de Jesus Cristo.",
    );
    expect(html).toContain(
      "Em nome do Pai, do Filho e do Espírito Santo. Amém.",
    );
    expect(html).toContain("Voltar ao Oratório");
  });
});

describe("Funcionalidades utilitárias de leitura, cópia, compartilhamento e responsividade", () => {
  test("adjustPrayerFontScale respeita os limites mínimo e máximo e altera a escala em passos configurados", () => {
    const initial = DAILY_PRAYER_SCALE.default;
    const increased = adjustPrayerFontScale(initial, DAILY_PRAYER_SCALE.step);
    expect(increased).toBe(1.1);

    const decreased = adjustPrayerFontScale(initial, -DAILY_PRAYER_SCALE.step);
    expect(decreased).toBe(0.9);

    expect(
      adjustPrayerFontScale(DAILY_PRAYER_SCALE.max, DAILY_PRAYER_SCALE.step),
    ).toBe(DAILY_PRAYER_SCALE.max);
    expect(
      adjustPrayerFontScale(DAILY_PRAYER_SCALE.min, -DAILY_PRAYER_SCALE.step),
    ).toBe(DAILY_PRAYER_SCALE.min);
  });

  test("copyPrayerText copia a oração formatada para a área de transferência", async () => {
    const prayer = DAILY_PRAYERS["oracao-da-manha"].prayers[0];
    const writeText = jest.fn().mockResolvedValue(undefined);

    const result = await copyPrayerText(prayer, { clipboard: { writeText } });
    expect(result).toEqual({
      ok: true,
      method: "clipboard",
      text: formatPrayerTextForShare(prayer),
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(formatPrayerTextForShare(prayer));
    expect(formatPrayerTextForShare(prayer)).toContain("Oração da Manhã");
  });

  test("sharePrayerText utiliza navigator.share quando disponível e faz fallback para clipboard quando ausente", async () => {
    const prayer = DAILY_PRAYERS["oracao-da-noite"].prayers[0];
    const mockShare = jest.fn().mockResolvedValue(undefined);
    const shareUrl =
      "https://panteralab.com.br/oratorio/oracoes/oracao-da-noite";

    const shared = await sharePrayerText(prayer, shareUrl, {
      share: mockShare,
    });

    expect(shared).toEqual({
      ok: true,
      method: "web-share",
      text: formatPrayerTextForShare(prayer),
    });
    expect(mockShare).toHaveBeenCalledWith({
      title: "Oração da Noite",
      text: formatPrayerTextForShare(prayer),
      url: shareUrl,
    });

    // Fallback para clipboard quando navigator.share não está disponível
    const writeText = jest.fn().mockResolvedValue(undefined);
    const fallbackResult = await sharePrayerText(prayer, shareUrl, {
      clipboard: { writeText },
    });

    expect(fallbackResult).toEqual({
      ok: true,
      method: "clipboard-fallback",
      text: formatPrayerTextForShare(prayer),
    });
    expect(writeText).toHaveBeenCalledWith(formatPrayerTextForShare(prayer));
  });

  test("identity.css possui regras responsivas para a grade de 3 colunas no desktop e 1 coluna no mobile", () => {
    const identityCss = fs.readFileSync(
      path.join(process.cwd(), "styles", "identity.css"),
      "utf8",
    );

    expect(identityCss).toContain(".pl-oratorio-daily-grid");
    expect(identityCss).toContain(
      "grid-template-columns: repeat(3, minmax(0, 1fr));",
    );
    expect(identityCss).toContain(".pl-daily-prayer-card");
    expect(identityCss).toContain(".pl-daily-prayer-options");
  });
});
