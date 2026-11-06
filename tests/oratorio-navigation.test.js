import fs from "node:fs";
import path from "node:path";
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

  test("Terço da Misericórdia (/terco-da-misericordia) continua acessível diretamente, exibe o novo layout editorial e mantém retorno ao Oratório", () => {
    mockUseRouter.mockReturnValue({
      pathname: "/terco-da-misericordia",
      asPath: "/terco-da-misericordia",
      query: {},
    });

    const html = renderToStaticMarkup(React.createElement(TercoDaMisericordia));

    // Breadcrumb
    expect(html).toContain(
      '<div class="p-breadcrumb pl-mercy-breadcrumb"><a href="/">Início</a><span>/</span><a href="/oratorio">Oratório</a><span>/</span>Terço da Misericórdia</div>',
    );
    expect(html).toContain('href="/oratorio" aria-current="page"');

    // Hero — Jesus Misericordioso
    expect(html).toContain("JESUS, EU CONFIO EM VÓS");
    expect(html).toContain("Terço da <em>Divina Misericórdia</em>");
    expect(html).toContain(
      "Uma oração de confiança na misericórdia de Deus para nós e para o mundo inteiro.",
    );
    expect(html).toContain("Rezar agora");
    expect(html).toContain("Ouvir a oração");
    expect(html).toContain(
      'src="/images/misericordia/jesus-misericordioso.webp"',
    );

    // Card de oração (coluna esquerda) e 7 grupos tradicionais
    expect(html).toContain("ORAÇÃO GUIADA POR VOZ E TEXTO");
    expect(html).toContain(
      "Reze conta a conta, com avanço automático ou no seu ritmo.",
    );
    expect(html).toContain(
      "Acompanhe as orações na ordem tradicional do Terço da Divina Misericórdia.",
    );
    expect(html).toContain("Iniciar oração");
    expect(html).toContain("Iniciar com áudio");
    expect(html).toContain("Sinal da Cruz");
    expect(html).toContain("Pai-Nosso");
    expect(html).toContain("Ave-Maria");
    expect(html).toContain("Credo (Símbolo dos Apóstolos)");
    expect(html).toContain("Cinco dezenas");
    expect(html).toContain("Invocação final (3 vezes)");
    expect(html).toContain("Oração conclusiva");

    // Coluna direita — 3 blocos informativos
    expect(html).toContain("A História");
    expect(html).toContain(
      "Revelada a Santa Faustina no século XX, a devoção convida a confiar na misericórdia de Jesus.",
    );
    expect(html).toContain('src="/images/misericordia/santa-faustina.webp"');
    expect(html).toContain("Como rezar");
    expect(html).toContain("É rezado em um terço comum, com cinco dezenas.");
    expect(html).toContain("Intenção");
    expect(html).toContain(
      "Pela conversão, pela nossa salvação e de todo o mundo.",
    );

    // Encerramento visual panorâmico
    expect(html).toContain('src="/images/misericordia/horizonte-cruz.webp"');
  });

  test("Rodapé (Footer) exibe apenas a logo centralizada e os três links institucionais, sem textos extras", () => {
    const html = renderToStaticMarkup(React.createElement(Home));

    expect(html).toContain("p-footer-brand");
    expect(html).toContain("p-footer-logo");
    expect(html).toContain("p-footer-links");
    expect(html).toContain('<a href="/sobre">Nossa casa</a>');
    expect(html).toContain('<a href="/privacidade">Privacidade</a>');
    expect(html).toContain('<a href="/fontes">Fontes e créditos</a>');

    expect(html).not.toContain("Um encontro com Deus. Um passo de cada vez.");
    expect(html).not.toContain(
      "Um auxílio à oração pessoal, em comunhão com a vida da Igreja.",
    );
  });

  test("Fundo global utiliza cor marfim uniforme sem a marca-d'água maria-fundo.webp em identity.css", () => {
    const identityCss = fs.readFileSync(
      path.join(process.cwd(), "styles", "identity.css"),
      "utf8",
    );

    expect(identityCss).toContain("--pl-paper: #f7f1e8;");
    expect(identityCss).toContain("background: var(--pl-paper);");
    expect(identityCss).not.toContain("maria-fundo.webp");
    expect(identityCss).not.toContain(".prayer-app::before");
  });
});
