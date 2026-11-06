import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseRouter = jest.fn();
const mockUseSession = jest.fn();
const capturedHeadChildren = [];

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
  default: ({ children }) => {
    capturedHeadChildren.push(children);
    return React.createElement("div", { "data-testid": "next-head" }, children);
  },
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

import Home, { EXPERIENCES } from "../pages/index";
import Oratorio, { ORATORIO_EXPERIENCES } from "../pages/oratorio";
import Rosario from "../pages/rosario";
import TercoDaMisericordia from "../pages/terco-da-misericordia";

beforeEach(() => {
  jest.clearAllMocks();
  capturedHeadChildren.length = 0;
  mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
  mockUseRouter.mockReturnValue({
    pathname: "/",
    asPath: "/",
    query: {},
  });
});

describe("Página inicial — Três caminhos e integração com o Oratório", () => {
  test("apresenta exatamente três caminhos numerados de 01 a 03: Oratório, Capelinha e Comunidades", () => {
    expect(EXPERIENCES).toHaveLength(3);
    expect(
      EXPERIENCES.map((item) => ({
        number: item.number,
        title: item.title,
        href: item.href,
      })),
    ).toEqual([
      { number: "01", title: "Oratório", href: "/oratorio" },
      { number: "02", title: "Capelinha", href: "/capelinha" },
      { number: "03", title: "Comunidades", href: "/comunidade" },
    ]);

    const html = renderToStaticMarkup(React.createElement(Home));
    expect(html).toContain("Três caminhos, um encontro");
    expect(html).toContain('href="/oratorio"');
    expect(html).toContain('href="/capelinha"');
    expect(html).toContain('href="/comunidade"');
    expect(html).toContain("Entrar no Oratório");
    expect(html).toContain("Visitar a Capelinha");
    expect(html).toContain("Encontrar a comunidade");
  });

  test("direciona os CTAs principais da Hero para /oratorio e preserva acesso ao Oratório e ao Rosário na Oração do dia", () => {
    const html = renderToStaticMarkup(React.createElement(Home));

    expect(html).toContain("Começar a rezar");
    expect(html).toContain("Conhecer o Oratório");
    expect(html).not.toContain(
      '<a href="/terco-da-misericordia" class="p-button p-button-outline">',
    );

    // Seção Oração do dia mantém passagem pelo Oratório sem eliminar acesso direto ao Rosário
    expect(html).toContain("ORAÇÃO DO DIA");
    expect(html).toContain("Ir ao Oratório");
    expect(html).toContain("Rezar os mistérios");
    expect(html).toContain('href="/rosario"');
  });
});

describe("Página Oratório (/oratorio) — Apresentação, Devoções e SEO", () => {
  test("renderiza cabeçalho contemplativo, metadados SEO e os dois cards das devoções existentes", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/oratorio",
      asPath: "/oratorio",
      query: {},
    });

    expect(ORATORIO_EXPERIENCES).toHaveLength(2);
    expect(ORATORIO_EXPERIENCES[0]).toMatchObject({
      number: "01",
      title: "Santo Rosário",
      href: "/rosario",
      cta: "Entrar no Santo Rosário",
      image: "/images/home/caminho-rosario.webp",
    });
    expect(ORATORIO_EXPERIENCES[1]).toMatchObject({
      number: "02",
      title: "Terço da Misericórdia",
      href: "/terco-da-misericordia",
      cta: "Rezar o Terço da Misericórdia",
      image: "/images/rosario/dolorosos/crucificacao.webp",
    });

    const html = renderToStaticMarkup(React.createElement(Oratorio));

    // SEO e Metadados
    expect(html).toContain("<title>Oratório | PanteraLab</title>");
    expect(html).toContain(
      'content="Um espaço de oração, contemplação e encontro com Deus. Acesse o Santo Rosário e o Terço da Misericórdia."',
    );

    // Textos estruturais do Oratório
    expect(html).toContain("<h1>Oratório</h1>");
    expect(html).toContain(
      "Um espaço de silêncio, contemplação e encontro com Deus.",
    );
    expect(html).toContain(
      "Encontre um momento de silêncio, oração e proximidade com Deus.",
    );
    expect(html).toContain(
      "Escolha seu caminho de oração e permita que este momento seja dedicado à fé, à contemplação e à confiança em Deus.",
    );

    // Cards e links de destino
    expect(html).toContain('href="/rosario"');
    expect(html).toContain("Entrar no Santo Rosário →");
    expect(html).toContain('src="/images/home/caminho-rosario.webp"');

    expect(html).toContain('href="/terco-da-misericordia"');
    expect(html).toContain("Rezar o Terço da Misericórdia →");
    expect(html).toContain('src="/images/rosario/dolorosos/crucificacao.webp"');

    // Navegação ativa no cabeçalho
    expect(html).toContain('href="/oratorio" aria-current="page"');
  });
});

describe("Breadcrumbs e preservação das rotas diretas (/rosario e /terco-da-misericordia)", () => {
  test("Santo Rosário (/rosario) continua acessível diretamente e exibe breadcrumb com retorno ao Oratório", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/rosario",
      asPath: "/rosario",
      query: {},
    });

    const html = renderToStaticMarkup(React.createElement(Rosario));

    expect(html).toContain("Santo Rosário");
    expect(html).toContain(
      '<div class="p-breadcrumb"><a href="/">Início</a><span>/</span><a href="/oratorio">Oratório</a><span>/</span>Santo Rosário</div>',
    );
    expect(html).toContain('href="/oratorio" aria-current="page"');
  });

  test("Terço da Misericórdia (/terco-da-misericordia) continua acessível diretamente e exibe breadcrumb com retorno ao Oratório", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/terco-da-misericordia",
      asPath: "/terco-da-misericordia",
      query: {},
    });

    const html = renderToStaticMarkup(React.createElement(TercoDaMisericordia));

    expect(html).toContain("Terço da");
    expect(html).toContain("Divina Misericórdia.");
    expect(html).toContain(
      '<div class="p-breadcrumb"><a href="/">Início</a><span>/</span><a href="/oratorio">Oratório</a><span>/</span>Terço da Misericórdia</div>',
    );
    expect(html).toContain('href="/oratorio" aria-current="page"');
  });
});
