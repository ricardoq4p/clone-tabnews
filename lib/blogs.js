import { idOf } from "./permissions";

export const AUTHORIZED_BLOG_AUTHORS = Object.freeze([
  { name: "Ricardo", email: "ricardosumo1000@gmail.com" },
  { name: "Ricardo", email: "ricardo.q4p@gmail.com" },
  { name: "Fernanda", email: "colorindoporai@gmail.com" },
]);

export const AUTHORIZED_BLOG_AUTHOR_EMAILS = Object.freeze(
  AUTHORIZED_BLOG_AUTHORS.map((author) => author.email),
);

const AUTHORIZED_BLOG_EMAIL_SET = new Set(AUTHORIZED_BLOG_AUTHOR_EMAILS);

export function normalizeBlogAuthorEmail(email = "") {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function isAuthorizedBlogAuthorEmail(email = "") {
  const normalized = normalizeBlogAuthorEmail(email);
  return Boolean(normalized && AUTHORIZED_BLOG_EMAIL_SET.has(normalized));
}

export function isSuperAdminSession(session) {
  return Boolean(session?.user?.role === "superadmin");
}

export function canPublishInBlog(session, resolvedEmail = "") {
  if (!session?.user) return false;
  if (isSuperAdminSession(session)) return true;
  const emailToCheck = resolvedEmail || session.user.email || "";
  return isAuthorizedBlogAuthorEmail(emailToCheck);
}

async function safeResolveDbUser(UserModel, { id, email }) {
  if (!UserModel) return null;
  try {
    if (email && typeof UserModel.findOne === "function") {
      const queryOrDoc = UserModel.findOne({ email });
      if (queryOrDoc) {
        const selected =
          typeof queryOrDoc.select === "function"
            ? queryOrDoc.select("_id name email role")
            : queryOrDoc;
        const doc =
          selected && typeof selected.lean === "function"
            ? await selected.lean()
            : await selected;
        if (doc && (doc._id || doc.email)) return doc;
      }
    }
    if (id && typeof UserModel.findById === "function") {
      const queryOrDoc = UserModel.findById(id);
      if (queryOrDoc) {
        const selected =
          typeof queryOrDoc.select === "function"
            ? queryOrDoc.select("_id name email role")
            : queryOrDoc;
        const doc =
          selected && typeof selected.lean === "function"
            ? await selected.lean()
            : await selected;
        if (doc && (doc._id || doc.email)) return doc;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function resolveBlogEditorialSession(session, UserModel) {
  if (!session?.user) return null;
  const rawEmail = normalizeBlogAuthorEmail(session.user.email);
  const rawId = session.user.id ? String(session.user.id) : "";
  const dbUser = await safeResolveDbUser(UserModel, {
    id: rawId,
    email: rawEmail,
  });

  const resolvedId = dbUser?._id ? String(dbUser._id) : rawId;
  const resolvedEmail = normalizeBlogAuthorEmail(dbUser?.email || rawEmail);
  const resolvedRole = dbUser?.role || session.user.role || "user";
  const resolvedName = dbUser?.name || session.user.name || "";

  const enrichedSession = {
    ...session,
    user: {
      ...session.user,
      id: resolvedId,
      email: resolvedEmail,
      role: resolvedRole,
      name: resolvedName,
    },
  };

  return {
    session: enrichedSession,
    userId: resolvedId,
    email: resolvedEmail,
    role: resolvedRole,
    name: resolvedName,
    isSuperAdmin: resolvedRole === "superadmin",
    isAuthorizedAuthor: isAuthorizedBlogAuthorEmail(resolvedEmail),
    canPublish: canPublishInBlog(enrichedSession, resolvedEmail),
  };
}

export const BLOG_CATEGORIES = [
  "Bíblia e Estudos",
  "Testemunhos",
  "Vida Cristã",
  "Orações",
  "Espiritualidade",
  "Família",
  "Reflexões",
];

export const BLOG_POST_CATEGORIES = BLOG_CATEGORIES;

export const BLOG_INSTITUTIONAL_DISCLAIMER =
  "Os textos publicados representam as opiniões e experiências de seus respectivos autores e não necessariamente a posição oficial do Caminhar para Cristo.";

export const BLOG_DIRECTORY_PAGE_SIZE = 9;
export const BLOG_POSTS_PAGE_SIZE = 12;

export const RESERVED_BLOG_IDENTIFIERS = new Set([
  "admin",
  "administracao",
  "api",
  "auth",
  "login",
  "logout",
  "register",
  "blogs",
  "blog",
  "meu-blog",
  "oratorio",
  "rosario",
  "terco-da-misericordia",
  "capelinha",
  "minhas-velas",
  "comunidade",
  "comunidades",
  "feed",
  "profile",
  "user",
  "users",
  "upload",
  "verify",
  "reset-password",
  "forgot-password",
  "resend-verification",
  "notificacoes",
  "sobre",
  "privacidade",
  "fontes",
  "404",
  "500",
  "_next",
  "static",
  "public",
  "sacred",
  "images",
  "audio",
  "caminhar-para-cristo",
  "panteralab",
  "moderacao",
  "suporte",
  "sistema",
  "oficial",
  "novo",
  "editar",
  "configuracoes",
  "denuncias",
]);

export function stripAccents(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeBlogName(name = "") {
  return stripAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function slugifyText(value = "", maxLength = 60) {
  const slug = stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return "";
  return slug.slice(0, maxLength).replace(/-+$/g, "");
}

export function isReservedBlogIdentifier(value = "") {
  const slug = slugifyText(value, 80);
  const normalizedSlug = normalizeBlogName(value).replace(/\s+/g, "-");
  if (!slug && !normalizedSlug) return true;
  return (
    RESERVED_BLOG_IDENTIFIERS.has(slug) ||
    RESERVED_BLOG_IDENTIFIERS.has(normalizedSlug)
  );
}

export function sanitizePlainField(value = "") {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on[a-z]+\s*=/gi, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeBlogPostContent(raw = "") {
  return String(raw || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    .replace(/on[a-z]+\s*=/gi, "")
    .replace(/[<>]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateBlogInput(payload = {}) {
  const name = sanitizePlainField(payload.name);
  const normalizedName = normalizeBlogName(name);
  const requestedSlug =
    typeof payload.slug === "string" && payload.slug.trim()
      ? payload.slug.trim()
      : name;
  const slug = slugifyText(requestedSlug, 60);
  const description = sanitizePlainField(payload.description);
  const authorBio = sanitizePlainField(payload.authorBio);

  if (name.length < 3 || name.length > 80) {
    return {
      ok: false,
      error: "O nome do blog deve ter entre 3 e 80 caracteres.",
    };
  }
  if (normalizedName.length < 3 || normalizedName.length > 80) {
    return {
      ok: false,
      error: "Informe um nome válido para o seu blog.",
    };
  }
  if (
    slug.length < 3 ||
    slug.length > 60 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    return {
      ok: false,
      error:
        "O endereço (slug) do blog deve ter entre 3 e 60 caracteres usando letras, números e hífens.",
    };
  }
  if (isReservedBlogIdentifier(name) || isReservedBlogIdentifier(slug)) {
    return {
      ok: false,
      error:
        "Este nome ou endereço é reservado pelo sistema. Escolha outra identificação para o seu blog.",
    };
  }
  if (description.length < 10 || description.length > 320) {
    return {
      ok: false,
      error: "A descrição curta deve ter entre 10 e 320 caracteres.",
    };
  }
  if (authorBio.length < 10 || authorBio.length > 600) {
    return {
      ok: false,
      error: "A apresentação do autor deve ter entre 10 e 600 caracteres.",
    };
  }

  return {
    ok: true,
    value: {
      name,
      normalizedName,
      slug,
      description,
      authorBio,
    },
  };
}

export function validateBlogPostInput(payload = {}) {
  const title = sanitizePlainField(payload.title);
  const subtitle = payload.subtitle ? sanitizePlainField(payload.subtitle) : "";
  const category =
    typeof payload.category === "string" ? payload.category.trim() : "";
  const content = sanitizeBlogPostContent(payload.content);
  const status = payload.status === "published" ? "published" : "draft";
  const rawSlugSource =
    typeof payload.slug === "string" && payload.slug.trim()
      ? payload.slug.trim()
      : title;
  const slug = slugifyText(rawSlugSource, 120);

  if (title.length < 3 || title.length > 140) {
    return {
      ok: false,
      error: "O título da publicação deve ter entre 3 e 140 caracteres.",
    };
  }
  if (subtitle.length > 220) {
    return {
      ok: false,
      error: "O subtítulo pode ter no máximo 220 caracteres.",
    };
  }
  if (!BLOG_POST_CATEGORIES.includes(category)) {
    return {
      ok: false,
      error: "Selecione uma categoria válida para a publicação.",
    };
  }
  if (
    slug.length < 3 ||
    slug.length > 120 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    ["novo", "editar", "api", "admin"].includes(slug)
  ) {
    return {
      ok: false,
      error: "Informe um título válido para gerar o endereço da publicação.",
    };
  }
  if (content.length < 20 || content.length > 30000) {
    return {
      ok: false,
      error: "O conteúdo da publicação deve ter entre 20 e 30.000 caracteres.",
    };
  }
  if (
    payload.status !== undefined &&
    !["draft", "published"].includes(payload.status)
  ) {
    return {
      ok: false,
      error: "Status de publicação inválido.",
    };
  }

  return {
    ok: true,
    value: {
      title,
      subtitle,
      slug,
      category,
      content,
      status,
    },
  };
}

export function canManageBlog(blog, session) {
  if (!blog || !session?.user?.id) return false;
  if (isSuperAdminSession(session)) return true;
  if (!canPublishInBlog(session)) return false;
  return idOf(blog.ownerId) === String(session.user.id);
}

export function canManageBlogPost(post, blog, session) {
  if (!post || !blog || !session?.user?.id) return false;
  if (idOf(post.blogId) !== idOf(blog._id)) return false;
  if (isSuperAdminSession(session)) return true;
  if (!canPublishInBlog(session)) return false;
  return (
    idOf(blog.ownerId) === String(session.user.id) &&
    idOf(post.authorId) === String(session.user.id)
  );
}

export function canReadPublicBlog(blog) {
  return Boolean(blog && blog.status === "active");
}

export function canReadPublicBlogPost(post, blog) {
  return Boolean(
    post &&
      blog &&
      blog.status === "active" &&
      post.status === "published" &&
      idOf(post.blogId) === idOf(blog._id),
  );
}

export function parseInlineFormatting(line = "") {
  const tokens = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        text: line.slice(lastIndex, match.index),
      });
    }
    if (match[2] !== undefined) {
      tokens.push({
        type: "strong",
        text: match[2],
      });
    } else if (match[3] !== undefined) {
      tokens.push({
        type: "em",
        text: match[3],
      });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({
      type: "text",
      text: line.slice(lastIndex),
    });
  }

  return tokens.length ? tokens : [{ type: "text", text: line }];
}

export function parseBlogContentBlocks(content = "") {
  const clean = sanitizeBlogPostContent(content);
  if (!clean) return [];

  const rawBlocks = clean.split(/\n{2,}/);
  const blocks = [];

  for (const rawBlock of rawBlocks) {
    const lines = rawBlock
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    const allUnordered = lines.every((line) => /^[-•*]\s+.+/.test(line));
    if (allUnordered) {
      blocks.push({
        type: "ul",
        items: lines.map((line) =>
          parseInlineFormatting(line.replace(/^[-•*]\s+/, "")),
        ),
      });
      continue;
    }

    const allOrdered = lines.every((line) => /^\d+[.)]\s+.+/.test(line));
    if (allOrdered) {
      blocks.push({
        type: "ol",
        items: lines.map((line) =>
          parseInlineFormatting(line.replace(/^\d+[.)]\s+/, "")),
        ),
      });
      continue;
    }

    for (const line of lines) {
      blocks.push({
        type: "paragraph",
        tokens: parseInlineFormatting(line),
      });
    }
  }

  return blocks;
}

export function summarizeBlogPost(content = "", maxLength = 180) {
  const plain = sanitizeBlogPostContent(content)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-•*]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trim()}…`;
}
