import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import Icon from "./Icon";
import localFont from "next/font/local";
import NotificationBell from "./NotificationBell";
import BrandLogo, { BRAND_ASSETS, BRAND_NAME } from "../BrandLogo";

const pixel = localFont({
  src: "../../public/fonts/pixelify-latin.woff2",
  variable: "--font-retro-pixel",
  display: "swap",
  weight: "400 700",
  fallback: ["Courier New", "monospace"],
});
const mono = localFont({
  src: "../../public/fonts/ibm-plex-mono-latin.woff2",
  variable: "--font-retro-mono",
  display: "swap",
  weight: "400",
  fallback: ["Courier New", "monospace"],
});
const links = [
  { href: "/", label: "Início", icon: "home" },
  {
    href: "/oratorio",
    label: "Oratório",
    short: "Oratório",
    icon: "rosary",
  },
  {
    href: "/blogs",
    label: "Blog",
    short: "Blog",
    icon: "book",
  },
  { href: "/capelinha", label: "Capelinha", icon: "candle" },
  {
    href: "/comunidade",
    label: "Comunidades",
    short: "Comunidade",
    icon: "people",
  },
];
export default function PrayerLayout({
  children,
  title = "Uma casa de oração",
  description = "Reze o Santo Rosário, apresente suas intenções e caminhe em comunidade.",
  legacy = false,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const fullTitle = title.includes("|") ? title : `${title} · ${BRAND_NAME}`;
  const currentSection = router.pathname?.startsWith("/oratorio")
    ? "/oratorio"
    : router.pathname?.startsWith("/blogs") ||
        router.pathname?.startsWith("/blog") ||
        router.pathname === "/meu-blog"
      ? "/blogs"
      : {
          "/rosario": "/oratorio",
          "/terco-da-misericordia": "/oratorio",
          "/minhas-velas": "/capelinha",
          "/feed": "/comunidade",
          "/comunidades/[id]": "/comunidade",
        }[router.pathname] || router.pathname;
  const accountCurrent = [
    "/profile",
    "/user/edit",
    "/upload",
    "/login",
  ].includes(router.pathname);

  return (
    <div
      className={`prayer-app ${pixel.variable} ${mono.variable} ${legacy ? "prayer-legacy" : ""}`}
    >
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#F7F1E8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:site_name" content={BRAND_NAME} />
        <meta property="og:title" content={fullTitle} />
        <meta name="twitter:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={BRAND_ASSETS.avatar.src} />
        <meta
          property="og:image:width"
          content={String(BRAND_ASSETS.avatar.width)}
        />
        <meta
          property="og:image:height"
          content={String(BRAND_ASSETS.avatar.height)}
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={BRAND_ASSETS.avatar.src} />
        <link
          rel="icon"
          type="image/png"
          sizes="64x64"
          href={BRAND_ASSETS.favicon.src}
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href={BRAND_ASSETS.favicon.svgSrc}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={BRAND_ASSETS.favicon.appleTouchSrc}
        />
        <link rel="manifest" href="/manifest.json" />
        {["homologacao-local", "homologacao-vercel"].includes(
          process.env.NEXT_PUBLIC_APP_ENV,
        ) ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : null}
      </Head>
      <a className="p-skip" href="#conteudo">
        Ir para o conteúdo
      </a>
      {process.env.NEXT_PUBLIC_APP_ENV === "homologacao-local" ? (
        <div className="p-homologation-banner" role="note">
          Homologação local · dados de teste · emails disponíveis na caixa local
        </div>
      ) : process.env.NEXT_PUBLIC_APP_ENV === "homologacao-vercel" ? (
        <div className="p-homologation-banner" role="note">
          Homologação · dados fictícios · ambiente de testes
        </div>
      ) : null}
      <header className="p-header">
        <Link href="/" className="p-brand" aria-label={`${BRAND_NAME}, início`}>
          <BrandLogo variant="horizontal" className="p-brand-logo" priority />
        </Link>
        <nav className="p-nav" aria-label="Principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={currentSection === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {session?.user?.role === "superadmin" ? (
          <Link
            href="/administracao"
            className="p-account p-admin-shortcut"
            aria-label="Abrir administração"
            aria-current={
              ["/administracao", "/admin"].includes(router.pathname)
                ? "page"
                : undefined
            }
          >
            <Icon name="shield" size={17} />
            <span>Administração</span>
          </Link>
        ) : null}
        <Link
          href={session ? "/profile" : "/login"}
          className="p-account"
          aria-label={session ? "Minha conta" : "Entrar"}
          aria-current={accountCurrent ? "page" : undefined}
        >
          <Icon name="user" size={17} />
          <span>
            {session ? session.user.name?.trim() || "Minha conta" : "Entrar"}
          </span>
        </Link>
        <NotificationBell />
        {session ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-account p-logout"
          >
            <Icon name="logout" size={17} />
            <span>Sair</span>
          </button>
        ) : (
          <Link href="/register" className="p-account p-register">
            Criar conta
          </Link>
        )}
      </header>
      <main id="conteudo" tabIndex={-1}>
        {children}
      </main>
      <footer className="p-footer">
        <Link
          href="/"
          className="p-footer-brand"
          aria-label={`${BRAND_NAME}, início`}
        >
          <BrandLogo variant="horizontal" className="p-footer-logo" />
        </Link>
        <nav className="p-footer-links" aria-label="Institucional">
          <Link href="/sobre">Nossa casa</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/fontes">Fontes e créditos</Link>
        </nav>
      </footer>
      <nav className="p-mobile-nav" aria-label="Navegação no celular">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={currentSection === link.href ? "page" : undefined}
          >
            <Icon name={link.icon} size={21} />
            <span>{link.short || link.label}</span>
          </Link>
        ))}
        <Link
          href={session ? "/profile" : "/login"}
          aria-current={accountCurrent ? "page" : undefined}
        >
          <Icon name="user" size={21} />
          <span>Minha conta</span>
        </Link>
      </nav>
    </div>
  );
}
