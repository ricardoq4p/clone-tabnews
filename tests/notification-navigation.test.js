import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseRouter = jest.fn();
const mockUseSession = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter(),
}));
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => React.createElement("img", { alt: props.alt || "" }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, onClick, className, children }) =>
    React.createElement("a", { href, onClick, className }, children),
}));

import MessageCard from "../components/MessageCard";
import Feed from "../pages/feed";
import CommunityPage from "../pages/comunidades/[id]";

const msgId = "6ad7c8976746387d568ef1fe";
const commentId = "6ae38dedadddb7798cf89b20";
const otherCommentId = "6ae38dedadddb7798cf89b21";
const communityId = "6ad28606605a619d0a8c1907";
const userId = "123456789012345678901234";

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSession.mockReturnValue({
    data: { user: { id: userId, name: "sumo", role: "user" } },
    status: "authenticated",
  });
});

test("MessageCard opens comments automatically when targeted by a notification", () => {
  mockUseRouter.mockReturnValue({
    query: { message: msgId, comment: commentId },
    asPath: `/feed?message=${msgId}&comment=${commentId}#comment-${commentId}`,
  });

  const html = renderToStaticMarkup(
    React.createElement(MessageCard, {
      msg: {
        _id: msgId,
        content: "Partilha original de sumo",
        author: "sumo",
        category: "prayer",
        createdAt: "2026-10-29T12:00:00.000Z",
      },
    }),
  );

  expect(html).toContain(`id="message-${msgId}"`);
  expect(html).toContain("Partilha original de sumo");
  expect(html).toContain("Ocultar");
  expect(html).toContain("Carregando comentarios...");
});

test("MessageCard highlights the notified comment after comments finish loading", () => {
  mockUseRouter.mockReturnValue({
    query: { message: msgId, comment: commentId },
    asPath: `/feed?message=${msgId}&comment=${commentId}#comment-${commentId}`,
  });

  const loadedComments = [
    {
      _id: otherCommentId,
      content: "Outro comentário mais recente",
      author: "Maria",
      createdAt: "2026-10-29T13:00:00.000Z",
    },
    {
      _id: commentId,
      content: "Teste de verificação de notificação!",
      author: "Agente de IA baiano",
      createdAt: "2026-10-29T12:30:00.000Z",
    },
  ];

  // Simulate post-load state where commentsLoading is false and comments are populated:
  let stateIndex = 0;
  const useStateSpy = jest
    .spyOn(React, "useState")
    .mockImplementation((init) => {
      const idx = stateIndex++;
      const initialValue = typeof init === "function" ? init() : init;
      if (idx === 1) return [loadedComments, jest.fn()]; // comments
      if (idx === 2) return [true, jest.fn()]; // commentsOpen
      if (idx === 3) return [false, jest.fn()]; // commentsLoading
      return [initialValue, jest.fn()];
    });

  const html = renderToStaticMarkup(
    React.createElement(MessageCard, {
      msg: {
        _id: msgId,
        content: "Partilha original de sumo",
        author: "sumo",
        category: "general",
        createdAt: "2026-10-29T12:00:00.000Z",
      },
      focused: true,
      highlightedCommentId: commentId,
    }),
  );
  useStateSpy.mockRestore();

  expect(html).toContain(`id="comment-${commentId}"`);
  expect(html).toContain('data-highlighted="true"');
  expect(html).toContain("p-comment-highlighted");
  expect(html).toContain("Comentário da notificação");
  expect(html).toContain("Teste de verificação de notificação!");
  expect(html).toContain("Agente de IA baiano");
});

test("MessageCard displays a clear fallback when the notified comment was deleted or is unavailable", () => {
  mockUseRouter.mockReturnValue({
    query: { message: msgId, comment: commentId },
    asPath: `/feed?message=${msgId}&comment=${commentId}#comment-${commentId}`,
  });

  let stateIndex = 0;
  const useStateSpy = jest
    .spyOn(React, "useState")
    .mockImplementation((init) => {
      const idx = stateIndex++;
      const initialValue = typeof init === "function" ? init() : init;
      if (idx === 1)
        return [
          [
            {
              _id: otherCommentId,
              content: "Outro comentário",
              author: "Maria",
              createdAt: "2026-10-29T13:00:00.000Z",
            },
          ],
          jest.fn(),
        ]; // comments (does not contain commentId)
      if (idx === 2) return [true, jest.fn()]; // commentsOpen
      if (idx === 3) return [false, jest.fn()]; // commentsLoading
      return [initialValue, jest.fn()];
    });

  const html = renderToStaticMarkup(
    React.createElement(MessageCard, {
      msg: {
        _id: msgId,
        content: "Partilha original de sumo",
        author: "sumo",
        category: "general",
        createdAt: "2026-10-29T12:00:00.000Z",
      },
      focused: true,
      highlightedCommentId: commentId,
    }),
  );
  useStateSpy.mockRestore();

  expect(html).toContain(
    "O comentário relacionado a esta notificação não está mais disponível.",
  );
});

test("Feed and CommunityPage display an explicit unavailable state instead of empty feed/community when the notified publication was deleted", () => {
  mockUseRouter.mockReturnValue({
    query: { id: communityId, message: msgId, comment: commentId },
    asPath: `/comunidades/${communityId}?message=${msgId}&comment=${commentId}#comment-${commentId}`,
    push: jest.fn(),
    replace: jest.fn(),
  });

  // Feed with feedLoading=false, requestedMessageUnavailable=true
  let feedIdx = 0;
  const feedSpy = jest.spyOn(React, "useState").mockImplementation((init) => {
    const idx = feedIdx++;
    const initialValue = typeof init === "function" ? init() : init;
    if (idx === 0) return [[], jest.fn()]; // messages
    if (idx === 3) return [false, jest.fn()]; // feedLoading
    if (idx === 4) return [true, jest.fn()]; // requestedMessageUnavailable
    return [initialValue, jest.fn()];
  });
  const feedHtml = renderToStaticMarkup(React.createElement(Feed));
  feedSpy.mockRestore();

  expect(feedHtml).toContain(
    "Esta publicação não está mais disponível ou foi removida.",
  );
  expect(feedHtml).not.toContain(
    "Nenhuma mensagem ainda. Seja a primeira pessoa a publicar.",
  );

  // CommunityPage with messagesLoading=false, requestedMessageUnavailable=true
  let commIdx = 0;
  const commSpy = jest.spyOn(React, "useState").mockImplementation((init) => {
    const idx = commIdx++;
    const initialValue = typeof init === "function" ? init() : init;
    if (idx === 2)
      return [{ _id: communityId, name: "São Luís IX" }, jest.fn()]; // community
    if (idx === 3) return [[], jest.fn()]; // messages
    if (idx === 5) return [false, jest.fn()]; // communityLoading
    if (idx === 6) return [false, jest.fn()]; // messagesLoading
    if (idx === 7) return [true, jest.fn()]; // requestedMessageUnavailable
    return [initialValue, jest.fn()];
  });
  const commHtml = renderToStaticMarkup(React.createElement(CommunityPage));
  commSpy.mockRestore();

  expect(commHtml).toContain(
    "Esta publicação não está mais disponível ou foi removida.",
  );
  expect(commHtml).toContain("Publicação indisponível");
  expect(commHtml).not.toContain("0 posts nesta comunidade");
  expect(commHtml).not.toContain("Ainda nao existem posts nesta comunidade");
});
