export function proxy() {
  // Sua lógica de proxy aqui, se houver.
  // Para proteger as rotas do dashboard e admin, você pode verificar a sessão aqui.
  // Como estamos usando o NextAuth, a proteção já pode ser feita nas páginas.
  // Por enquanto, deixaremos vazio, apenas para atender à exigência do Next.js.
  return;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
