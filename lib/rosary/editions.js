import { randomUUID } from "crypto";
import { DEFAULT_CONTENT, BUILT_IN_EDITIONS } from "./content";
import RosaryEdition from "../models/RosaryEdition";
import { validText, validImageUrl } from "../validation";
import { ApiError } from "../api";
export async function getRosaryContent(version) {
  if (version && Object.hasOwn(BUILT_IN_EDITIONS, version))
    return BUILT_IN_EDITIONS[version];
  if (!process.env.MONGODB_URI) {
    if (version)
      throw new ApiError(
        404,
        "Esta versão da oração não está disponível neste ambiente.",
      );
    return DEFAULT_CONTENT;
  }
  const edition = version
    ? await RosaryEdition.findOne({ version }).lean()
    : await RosaryEdition.findOne().sort({ _id: -1 }).lean();
  if (version && !edition)
    throw new ApiError(404, "Esta versão da oração não está disponível.");
  return edition?.content || DEFAULT_CONTENT;
}
export function prepareEdition(input) {
  const content = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  if (
    !input ||
    !input.prayers ||
    !Array.isArray(input.sets) ||
    input.sets.length !== 4
  )
    throw new ApiError(400, "Conteúdo incompleto.");
  for (const [id, prayer] of Object.entries(content.prayers)) {
    if (
      !validText(input.prayers[id]?.title, 100) ||
      !validText(input.prayers[id]?.text, 2500)
    )
      throw new ApiError(400, "Confira os textos das orações.");
    prayer.title = input.prayers[id].title.trim();
    prayer.text = input.prayers[id].text.trim();
  }
  for (const set of content.sets) {
    const edited = input.sets.find((item) => item.id === set.id);
    if (
      !edited ||
      !Array.isArray(edited.mysteries) ||
      edited.mysteries.length !== 5
    )
      throw new ApiError(400, "Cada conjunto precisa dos cinco mistérios.");
    for (const mystery of set.mysteries) {
      const value = edited.mysteries.find((item) => item.id === mystery.id);
      if (
        !value ||
        !validText(value.title, 180) ||
        !validText(value.scripture, 120) ||
        !validText(value.meditation, 1500) ||
        !validText(value.imageAlt, 250) ||
        !validText(value.credit, 250) ||
        !(value.image === mystery.image || validImageUrl(value.image))
      )
        throw new ApiError(400, "Confira as meditações, imagens e créditos.");
      for (const key of [
        "title",
        "scripture",
        "meditation",
        "image",
        "imageAlt",
        "credit",
      ])
        mystery[key] = value[key].trim();
    }
  }
  content.version = `rosary-${randomUUID()}`;
  return content;
}
