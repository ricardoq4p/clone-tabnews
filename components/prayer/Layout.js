import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Icon from "./Icon";
const links = [
  { href: "/", label: "Início", icon: "home" },
  {
    href: "/rosario",
    label: "Santo Rosário",
    short: "Rosário",
    icon: "rosary",
  },
  { href: "/capelinha", label: "Capelinha", icon: "candle" },
  { href: "/comunidade", label: "Comunidade", icon: "people" },
];
export default function PrayerLayout({
  children,
  title = "Uma casa de oração",
  description = "Reze o Santo Rosário, apresente suas intenções e caminhe em comunidade.",
  legacy = false,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  return (
    <div className={`prayer-app ${legacy ? "prayer-legacy" : ""}`}>
      <Head>
        <title>{`${title} · PanteraLab`}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#f6f3ec" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/sacred/favicon.svg" />
      </Head>
      <a className="p-skip" href="#conteudo">
        Ir para o conteúdo
      </a>
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
              aria-current={router.pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href={session ? "/profile" : "/login"} className="p-account">
          <Icon name="user" size={17} />
          <span>
            {session
              ? session.user.name?.split(" ")[0] || "Minha conta"
              : "Entrar"}
          </span>
        </Link>
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
            aria-current={router.pathname === link.href ? "page" : undefined}
          >
            <Icon name={link.icon} size={21} />
            <span>{link.short || link.label}</span>
          </Link>
        ))}
        <Link href={session ? "/profile" : "/login"}>
          <Icon name="user" size={21} />
          <span>Minha conta</span>
        </Link>
      </nav>
    </div>
  );
}
