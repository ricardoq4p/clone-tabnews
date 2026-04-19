const PANTERA_TRIGGER_REGEX = /(^|\s)@pantera\b/i;

export const PANTERA_PROFILE = {
  name: "Pantera IA",
  avatar:
    "https://api.dicebear.com/9.x/bottts-neutral/png?seed=PanteraIA&backgroundColor=1b1f3a,0f172a,111827",
};

export function hasPanteraMention(text = "") {
  return PANTERA_TRIGGER_REGEX.test(text);
}

function buildThreadSummary(message, comments = []) {
  const threadLines = [
    `Post principal de ${message.author}: ${message.content}`,
    ...comments.slice(0, 8).map((comment) => `${comment.author}: ${comment.content}`),
  ];

  return threadLines.join("\n");
}

function buildFallbackReply(authorName) {
  return `Oi ${authorName}, estou por aqui. Vi sua mencao ao @pantera e queria responder, mas a integracao de IA ainda nao recebeu a chave de API em producao. Assim que o OPENAI_API_KEY estiver configurado, eu passo a responder automaticamente no proprio site.`;
}

export async function generatePanteraReply({
  authorName,
  message,
  comments = [],
  mentionSource,
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildFallbackReply(authorName);
  }

  const systemPrompt = [
    "Voce eh a Pantera IA, assistente oficial da comunidade Pantera.",
    "Responda em portugues do Brasil.",
    "Seja calorosa, objetiva e conversacional.",
    "Responda como um comentario curto, com no maximo 4 frases.",
    "Se houver uma pergunta, responda diretamente.",
    "Se a pessoa apenas chamou a Pantera, confirme presenca e convide a continuar.",
    "Nao use markdown nem cercas de codigo.",
  ].join(" ");

  const input = [
    `Usuario que mencionou: ${authorName}`,
    `Origem da mencao: ${mentionSource}`,
    `Conteudo que chamou a IA: ${mentionSource.content}`,
    "Contexto da conversa:",
    buildThreadSummary(message, comments),
  ].join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: input }],
        },
      ],
      text: {
        format: {
          type: "text",
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = data.output_text?.trim();

  if (!outputText) {
    throw new Error("OpenAI returned an empty response.");
  }

  return outputText;
}
