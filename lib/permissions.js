// Pure policy functions, shared by APIs and regression tests.
export function idOf(value) {
  return value?._id?.toString() || value?.toString() || "";
}

export function isMember(community, userId) {
  if (!community || community.deletedAt || !userId) return false;
  return (
    idOf(community.ownerId) === userId ||
    (community.members || []).some((member) => idOf(member) === userId)
  );
}

export function canReadCommunity(community, userId) {
  return Boolean(
    community &&
      !community.deletedAt &&
      (community.privacy === "public" || isMember(community, userId)),
  );
}

export function canReadMessage(message, community, userId) {
  if (!message || message.status === "hidden") return false;
  // An unresolved reference is never a public feed post.
  return message.communityId ? canReadCommunity(community, userId) : true;
}

export function canDeleteContent(content, session) {
  return Boolean(
    session?.user?.id &&
      (session.user.role === "superadmin" ||
        (content.userId && idOf(content.userId) === session.user.id)),
  );
}

export function isSessionCurrent(user, token) {
  return Boolean(
    user?.isVerified &&
      !user.disabledAt &&
      (user.sessionVersion || 0) === (token.sessionVersion || 0),
  );
}
