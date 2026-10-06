import keys from "./client-message-keys.json";
import type { Messages } from "./translate";
const selected = new Set(keys);

// Imported by the server only. The browser receives the selected values, not
// the manifest, complete dictionaries or server-only editorial/policy text.
export function clientMessages(messages: Messages): Messages {
  // Preserve catalog order: the translator resolves case-folded aliases and
  // equally long interpolation patterns in that established order.
  return Object.fromEntries(Object.entries(messages).filter(([key]) => selected.has(key)));
}
