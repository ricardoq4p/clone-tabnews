import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import Icon from "./Icon";
import localFont from "next/font/local";

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
    href: "/rosario",
    label: "Santo Rosário",
    short: "Rosário",
    icon: "rosary",
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
  const currentSection =
    {
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
        <title>{`${title} · PanteraLab`}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#080B0A" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/sacred/favicon.svg" />
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
        <Link href="/" className="p-brand" aria-label="PanteraLab, início">
          <span className="p-brand-mark">
            <Icon name="cross" size={23} />
          </span>
          <span>
            PanteraLab<small>CASA DE ORAÇÃO</small>
          </span>
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
            {session
              ? session.user.name?.split(" ")[0] || "Minha conta"
              : "Entrar"}
          </span>
        </Link>
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
        <div>
          <Link href="/" className="p-footer-brand">
            <Icon name="cross" size={17} />
            PanteraLab
          </Link>
          <p>Um encontro com Deus. Um passo de cada vez.</p>
        </div>
        <div>
          <Link href="/sobre">Nossa casa</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/fontes">Fontes e créditos</Link>
          {session?.user?.role === "superadmin" ? (
            <Link href="/administracao">Administração</Link>
          ) : null}
        </div>
        <p className="p-footer-note">
          Um auxílio à oração pessoal, em comunhão com a vida da Igreja.
        </p>
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
