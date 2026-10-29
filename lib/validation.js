export function isObjectId(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

export function validText(value, max = 5000) {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}

export function validEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

export function validImageUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return Boolean(
      cloud &&
        url.protocol === "https:" &&
        url.hostname === "res.cloudinary.com" &&
        !url.username &&
        !url.password &&
        url.pathname.startsWith(`/${cloud}/image/upload/`),
    );
  } catch {
    return false;
  }
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function notificationCommentId(notification) {
  if (notification?.type !== "message_comment") return null;
  const direct =
    notification.commentId?._id?.toString?.() ||
    notification.commentId?.toString?.() ||
    notification.commentId ||
    null;
  if (isObjectId(direct)) {
    return direct;
  }
  if (typeof notification.dedupeKey === "string") {
    const match = /^message-comment:([a-f0-9]{24})$/i.exec(
      notification.dedupeKey.trim(),
    );
    if (match && isObjectId(match[1])) {
      return match[1];
    }
  }
  return null;
}

export function notificationHref(notification) {
  const id = notification?.targetId?.toString?.() || notification?.targetId;
  if (!isObjectId(id)) return "/";
  switch (notification.type) {
    case "candle_prayer":
      return `/minhas-velas?candle=${encodeURIComponent(id)}`;
    case "message_prayer":
    case "message_comment": {
      const rawCommunityId =
        notification.communityId?.toString?.() ||
        notification.communityId ||
        null;
      const communityId = isObjectId(rawCommunityId) ? rawCommunityId : null;
      const commentId = notificationCommentId(notification);
      const basePath = communityId
        ? `/comunidades/${encodeURIComponent(communityId)}`
        : "/feed";
      const query = commentId
        ? `message=${encodeURIComponent(id)}&comment=${encodeURIComponent(commentId)}`
        : `message=${encodeURIComponent(id)}`;
      const hash = commentId
        ? `#comment-${encodeURIComponent(commentId)}`
        : `#message-${encodeURIComponent(id)}`;
      return `${basePath}?${query}${hash}`;
    }
    case "community_invite":
      return `/comunidades/${encodeURIComponent(id)}`;
    default:
      return "/";
  }
}

export function parseNotificationTarget(query = {}, hash = "") {
  const rawMessage =
    typeof query?.message === "string" ? query.message.trim() : "";
  const rawComment =
    typeof query?.comment === "string" ? query.comment.trim() : "";
  const hashValue =
    typeof hash === "string" ? hash.replace(/^#/, "").trim() : "";

  let messageId = isObjectId(rawMessage) ? rawMessage : "";
  let commentId = isObjectId(rawComment) ? rawComment : "";

  if (!messageId && hashValue.startsWith("message-")) {
    try {
      const candidate = decodeURIComponent(hashValue.slice("message-".length));
      if (isObjectId(candidate)) messageId = candidate;
    } catch {
      /* ignore malformed URI sequence */
    }
  }
  if (!commentId && hashValue.startsWith("comment-")) {
    try {
      const candidate = decodeURIComponent(hashValue.slice("comment-".length));
      if (isObjectId(candidate)) commentId = candidate;
    } catch {
      /* ignore malformed URI sequence */
    }
  }

  return {
    messageId,
    commentId,
    hasInvalidMessageParam: Boolean(rawMessage && !messageId),
    hasInvalidCommentParam: Boolean(rawComment && !commentId),
  };
}

export function resolveNotificationTarget(query = {}, search = "", hash = "") {
  const mergedQuery = { ...query };
  if (typeof search === "string" && search) {
    const params = new URLSearchParams(search);
    if (!mergedQuery.message && params.get("message")) {
      mergedQuery.message = params.get("message");
    }
    if (!mergedQuery.comment && params.get("comment")) {
      mergedQuery.comment = params.get("comment");
    }
  }
  return parseNotificationTarget(mergedQuery, hash);
}
