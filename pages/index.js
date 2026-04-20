import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

const initialCommunities = [
  {
    id: "design",
    name: "Design sem Template",
    description:
      "Para quem quer interfaces autorais, landing pages fortes e identidade visual com personalidade.",
    privacy: "Publica",
    members: 2840,
    joinLabel: "Participar",
    leaveLabel: "Sair da comunidade",
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "ia",
    name: "IA para Negocios",
    description:
      "Grupo mais fechado para trocar automacoes, prompts uteis e fluxos de produtividade.",
    privacy: "Privada",
    members: 126,
    joinLabel: "Solicitar entrada",
    leaveLabel: "Cancelar solicitacao",
    image:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "orkut",
    name: "Orkut Feelings",
    description:
      "Saudade de comunidades com personalidade, humor interno e senso real de pertencimento.",
    privacy: "Publica",
    members: 901,
    joinLabel: "Participar",
    leaveLabel: "Sair da comunidade",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
];

const roadmap = [
  {
    title: "Fase 1",
    text: "Criar comunidades, entrar e sair, definir imagem, descricao, privacidade e numero de membros.",
  },
  {
    title: "Fase 2",
    text: "Adicionar topicos fixados, regras da comunidade, moderadores e listagem de membros.",
  },
  {
    title: "Fase 3",
    text: "Misturar feed e forum: descoberta no feed principal, profundidade dentro das comunidades.",
  },
];

function formatMembers(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function getUploadStatus(size) {
  if (size <= 150) {
    return {
      text: "Dentro do limite para avatar",
      color: "text-emerald-900",
      tone: "bg-emerald-100",
    };
  }

  if (size <= 220) {
    return {
      text: "Bom para imagem de comunidade",
      color: "text-emerald-900",
      tone: "bg-emerald-100",
    };
  }

  if (size <= 350) {
    return {
      text: "Serve para capa leve, mas nao para avatar",
      color: "text-amber-900",
      tone: "bg-amber-100",
    };
  }

  return {
    text: "Arquivo pesado: comprimir antes de salvar",
    color: "text-rose-900",
    tone: "bg-rose-100",
  };
}

export default function Home() {
  const [communities, setCommunities] = useState(
    initialCommunities.map((community) => ({ ...community, joined: false })),
  );
  const [heroMembers, setHeroMembers] = useState(1401);
  const [heroJoined, setHeroJoined] = useState(true);
  const [imageSize, setImageSize] = useState(180);

  const uploadStatus = useMemo(() => getUploadStatus(imageSize), [imageSize]);

  function toggleHeroCommunity() {
    setHeroJoined((current) => !current);
    setHeroMembers((current) => current + (heroJoined ? -1 : 1));
  }

  function toggleCommunity(targetId) {
    setCommunities((current) =>
      current.map((community) => {
        if (community.id !== targetId) {
          return community;
        }

        return {
          ...community,
          joined: !community.joined,
          members: community.members + (community.joined ? -1 : 1),
        };
      }),
    );
  }

  return (
    <>
      <Head>
        <title>PanteraLab Comunidades</title>
        <meta
          name="description"
          content="Comunidades do PanteraLab com privacidade publica ou privada, membros, perfil e imagens leves para nao pesar no banco."
        />
      </Head>

      <main className="min-h-screen bg-[#f4efe8] text-stone-900">
        <div className="mx-auto w-[min(1180px,calc(100%-24px))] py-5">
          <header className="sticky top-4 z-20 flex items-center justify-between gap-4 rounded-full border border-stone-300/70 bg-[#f8f3eb]/90 px-5 py-4 shadow-[0_18px_50px_rgba(32,20,10,0.12)] backdrop-blur">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-bold tracking-[-0.03em] text-stone-900"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-900 text-[#fff7ef]">
                PL
              </span>
              <span className="hidden sm:inline">PanteraLab</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-stone-700 md:flex">
              <a href="#comunidades">Comunidades</a>
              <a href="#perfil">Perfil</a>
              <a href="#imagens">Imagens leves</a>
              <a href="#roadmap">Roadmap</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:-translate-y-0.5"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-[#fff7ef] transition hover:-translate-y-0.5"
              >
                Criar conta
              </Link>
            </div>
          </header>

          <section className="grid gap-7 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-20">
            <div className="pt-3">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                PanteraLab Comunidades
              </p>
              <h1 className="max-w-[11ch] text-5xl font-bold leading-[0.95] tracking-[-0.05em] text-stone-900 sm:text-6xl md:text-7xl">
                Um forum social para{" "}
                <span className="font-serif font-normal italic">entrar na bolha certa</span>{" "}
                e conversar sem o caos do feed.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
                Em vez de perder assunto na timeline, cada tema ganha sua propria
                comunidade com imagem, privacidade, contador de membros e o gesto
                simples de participar ou sair.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#comunidades"
                  className="rounded-full bg-stone-900 px-5 py-3 font-semibold text-[#fff7ef] transition hover:-translate-y-0.5"
                >
                  Explorar comunidades
                </a>
                <Link
                  href="/feed"
                  className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-stone-900 transition hover:-translate-y-0.5"
                >
                  Ver feed atual
                </Link>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Conversas organizadas",
                    text: "Topicos antigos continuam vivos e pesquisaveis.",
                  },
                  {
                    title: "Bolhas intencionais",
                    text: "Cada pessoa escolhe de que comunidade quer fazer parte.",
                  },
                  {
                    title: "Storage sob controle",
                    text: "Avatares e capas leves para caber num banco gratuito.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-[22px] border border-stone-300/70 bg-white/70 p-5 shadow-[0_14px_40px_rgba(32,20,10,0.08)]"
                  >
                    <strong className="block text-base tracking-[-0.03em]">{item.title}</strong>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="overflow-hidden rounded-[32px] border border-stone-300/70 bg-[linear-gradient(145deg,rgba(255,253,248,0.98),rgba(234,240,247,0.92))] shadow-[0_20px_60px_rgba(32,20,10,0.12)] md:grid md:grid-cols-[220px_1fr]">
              <div className="relative min-h-[280px] md:min-h-full">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
                  alt="Comunidade PanteraLab em destaque"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-stone-900/85 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#fff7ef]">
                  Publica
                </span>
              </div>

              <div className="grid gap-6 p-6">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                    Comunidade em destaque
                  </p>
                  <h2 className="text-3xl font-bold tracking-[-0.04em]">
                    PanteraLab Criadores
                  </h2>
                  <p className="mt-3 text-base leading-7 text-stone-600">
                    Um espaco para trocar ideias sobre produto, comunidades, IA
                    e internet mais sociavel.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-sky-100/70 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500">
                      Dono
                    </p>
                    <p className="mt-2 font-bold">Ricardo</p>
                  </div>
                  <div className="rounded-3xl bg-sky-100/70 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500">
                      Membros
                    </p>
                    <p className="mt-2 font-bold">{formatMembers(heroMembers)}</p>
                  </div>
                  <div className="rounded-3xl bg-sky-100/70 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-stone-500">
                      Categoria
                    </p>
                    <p className="mt-2 font-bold">Internet e criacao</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={toggleHeroCommunity}
                    className={`rounded-full px-5 py-3 font-semibold text-[#fff7ef] transition hover:-translate-y-0.5 ${
                      heroJoined ? "bg-stone-900" : "bg-emerald-700"
                    }`}
                  >
                    {heroJoined ? "Sair da comunidade" : "Participar"}
                  </button>
                  <Link
                    href="/profile"
                    className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-stone-900 transition hover:-translate-y-0.5"
                  >
                    Criar comunidade
                  </Link>
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-3 border-y border-stone-300/70 py-4 text-center text-sm text-stone-600 md:grid-cols-6">
            {[
              "Comunidades",
              "Topicos",
              "Membros",
              "Moderacao",
              "Imagens leves",
              "Feed filtrado",
            ].map((item) => (
              <p key={item}>{item}</p>
            ))}
          </section>

          <section id="comunidades" className="pt-20">
            <div className="max-w-4xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                Exploracao
              </p>
              <h2 className="text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">
                Comunidades com cara propria, contador de membros e botoes simples
                para entrar ou sair.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {communities.map((community) => (
                <article
                  key={community.id}
                  className="overflow-hidden rounded-[28px] border border-stone-300/70 bg-white/80 shadow-[0_18px_50px_rgba(32,20,10,0.08)]"
                >
                  <img
                    src={community.image}
                    alt={community.name}
                    className="h-56 w-full object-cover"
                  />
                  <div className="grid gap-5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span
                        className={`rounded-full px-3 py-2 font-bold ${
                          community.privacy === "Privada"
                            ? "bg-stone-900 text-[#fff7ef]"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {community.privacy}
                      </span>
                      <span className="rounded-full bg-orange-100 px-3 py-2 font-bold text-orange-800">
                        {formatMembers(community.members)} membros
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold tracking-[-0.04em]">
                        {community.name}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-stone-600">
                        {community.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCommunity(community.id)}
                      className={`rounded-full px-5 py-3 font-semibold text-[#fff7ef] transition hover:-translate-y-0.5 ${
                        community.joined ? "bg-emerald-700" : "bg-stone-900"
                      }`}
                    >
                      {community.joined ? community.leaveLabel : community.joinLabel}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="perfil" className="grid gap-6 pt-20 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                Perfil do usuario
              </p>
              <h2 className="text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">
                A opcao de criar comunidade mora no perfil, para dar posse,
                identidade e responsabilidade a quem cria.
              </h2>
            </div>

            <article className="rounded-[28px] border border-stone-300/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(32,20,10,0.08)]">
              <div className="flex items-center gap-4">
                <div className="grid h-[72px] w-[72px] place-items-center rounded-[24px] bg-[linear-gradient(145deg,#ff8a59,#b9471f)] text-xl font-bold text-[#fff7ef]">
                  RC
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                    Perfil
                  </p>
                  <h3 className="text-3xl font-bold tracking-[-0.04em]">Ricardo</h3>
                  <p className="mt-2 text-stone-600">
                    Criador de 3 comunidades, participa de 18 e modera 2 grupos
                    privados.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="rounded-full bg-stone-900 px-5 py-3 font-semibold text-[#fff7ef] transition hover:-translate-y-0.5"
                >
                  Criar comunidade
                </Link>
                <Link
                  href="/user/edit"
                  className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-stone-900 transition hover:-translate-y-0.5"
                >
                  Editar perfil
                </Link>
              </div>

              <ul className="mt-6 grid gap-3">
                {[
                  "Escolhe nome, descricao, imagem e categoria.",
                  "Define se a comunidade sera publica ou privada.",
                  "Pode convidar moderadores e controlar entradas.",
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-3xl border border-stone-300/70 bg-stone-50 px-4 py-4 text-stone-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section id="imagens" className="pt-20">
            <div className="max-w-4xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                Imagens leves
              </p>
              <h2 className="text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">
                Perfis e comunidades podem ter imagem, mas com limites claros
                para nao lotar o banco gratuito.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <article className="rounded-[28px] border border-stone-300/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(32,20,10,0.08)]">
                <h3 className="text-2xl font-bold tracking-[-0.04em]">
                  Regras recomendadas
                </h3>
                <ul className="mt-5 grid gap-3 text-stone-700">
                  {[
                    "Avatar de perfil: ate 300 x 300 px e maximo de 150 KB.",
                    "Imagem da comunidade: ate 500 x 500 px e maximo de 220 KB.",
                    "Capa opcional: ate 1200 x 400 px e maximo de 350 KB.",
                    "Converter upload para WebP e salvar apenas a URL no banco.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="rounded-3xl border border-stone-300/70 bg-stone-50 px-4 py-4"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[28px] border border-stone-300/70 bg-[linear-gradient(145deg,rgba(255,138,89,0.12),rgba(214,228,245,0.55))] p-6 shadow-[0_18px_50px_rgba(32,20,10,0.08)]">
                <h3 className="text-2xl font-bold tracking-[-0.04em]">
                  Simulador de upload
                </h3>
                <p className="mt-3 max-w-xl leading-7 text-stone-600">
                  Um feedback simples no frontend ja ajuda a educar o usuario
                  antes do envio e evita acumulo desnecessario.
                </p>

                <div className="mt-8">
                  <label
                    htmlFor="image-size"
                    className="mb-3 block text-sm font-bold text-stone-900"
                  >
                    Tamanho do arquivo (KB)
                  </label>
                  <input
                    id="image-size"
                    name="image-size"
                    type="range"
                    min="40"
                    max="800"
                    value={imageSize}
                    onChange={(event) => setImageSize(Number(event.target.value))}
                    className="w-full accent-[#ff8552]"
                  />

                  <div className="mt-5 flex flex-col gap-4 rounded-[22px] border border-stone-300/70 bg-white/75 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-stone-700">{imageSize} KB</span>
                    <strong
                      className={`rounded-full px-4 py-2 text-sm ${uploadStatus.tone} ${uploadStatus.color}`}
                    >
                      {uploadStatus.text}
                    </strong>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section id="roadmap" className="pt-20">
            <div className="max-w-4xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                Roadmap
              </p>
              <h2 className="text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">
                O caminho natural e misturar feed e forum: descoberta no feed,
                profundidade dentro das comunidades.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {roadmap.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[28px] border border-stone-300/70 bg-[linear-gradient(180deg,rgba(91,118,83,0.12),rgba(255,255,255,0.86))] p-6 shadow-[0_18px_50px_rgba(32,20,10,0.08)]"
                >
                  <span className="text-2xl font-bold tracking-[-0.03em]">
                    {item.title}
                  </span>
                  <p className="mt-3 text-stone-600">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-20 grid gap-6 rounded-[32px] bg-[linear-gradient(135deg,rgba(21,17,13,0.96),rgba(84,56,35,0.95))] px-7 py-8 text-[#fff7ef] shadow-[0_20px_60px_rgba(32,20,10,0.18)] lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-200/80">
                Proximo passo
              </p>
              <h2 className="max-w-[13ch] text-4xl font-bold leading-none tracking-[-0.04em] sm:text-5xl">
                Agora isso pode virar deploy automatico pelo proprio repo.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-orange-50/75">
                Se essa home te agradar, o proximo passo tecnico e commitar no
                GitHub do clone-tabnews para a Vercel assumir o deploy continuo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-full bg-[#ff8552] px-5 py-3 font-semibold text-stone-950 transition hover:-translate-y-0.5"
              >
                Abrir feed
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-5 py-3 font-semibold text-[#fff7ef] transition hover:-translate-y-0.5"
              >
                Entrar no app
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
