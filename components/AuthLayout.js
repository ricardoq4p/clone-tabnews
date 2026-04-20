export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.14),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-10 lg:flex-row lg:items-center lg:px-10">
        <section className="max-w-xl">
          <div className="mb-5 flex items-center gap-4">
            <img
              src="https://raw.githubusercontent.com/ricardoq4p/clone-tabnews/main/PanteraLab.png"
              alt="Logo PanteraLab"
              className="h-14 w-14 rounded-2xl object-cover ring-1 ring-cyan-300/20"
            />
            <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Comunidade Pantera
            </span>
          </div>
          <h1 className="max-w-lg text-4xl font-bold leading-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-6 inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
            Novidade: mencione @pantera em um post ou comentario e a Pantera IA responde no proprio site.
          </div>

          <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="glass-panel rounded-2xl p-4">
              <p className="font-semibold text-white">Feed em tempo real</p>
              <p className="mt-1 text-slate-400">
                Publique, responda e acompanhe a conversa sem recarregar a pagina.
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="font-semibold text-white">Pantera IA por mencao</p>
              <p className="mt-1 text-slate-400">
                Chame a inteligencia da casa com @pantera e receba resposta automatica na conversa.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel w-full max-w-md rounded-[28px] p-6 sm:p-8">
          {children}
          {footer ? <div className="mt-6 border-t border-white/10 pt-5">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}
