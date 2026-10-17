// Never mutate an archived edition. Add a new versioned module and retain old entries.
import { DEFAULT_CONTENT } from "./content-v2026-1";
export {
  CONTENT_VERSION,
  PRAYERS,
  MYSTERY_SETS,
  DEFAULT_CONTENT,
  CONTENT_SOURCES,
  MYSTERY_PAINTINGS,
  resolveMysteryArtwork,
} from "./content-v2026-1";
export const BUILT_IN_EDITIONS = { [DEFAULT_CONTENT.version]: DEFAULT_CONTENT };
