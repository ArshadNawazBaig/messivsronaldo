import type { RichNode } from "./model";

export function articleHeadingId(key: string) { return `article-${key}`; }

/** Use document positions so repeated and translated headings have unique anchors. */
export function articleHeadings(body: RichNode): { id: string; title: string; level: number }[] {
  const result: { id: string; title: string; level: number }[] = [];
  const text = (node: RichNode): string => node.text ?? (node.content ?? []).map(text).join("");
  function visit(node: RichNode, key: string) {
    if (node.type === "heading" && text(node).trim()) {
      result.push({ id: articleHeadingId(key), title: text(node).trim(), level: Number(node.attrs?.level) || 2 });
    }
    node.content?.forEach((child, index) => visit(child, `${key}-${index}`));
  }
  visit(body, "body");
  return result;
}
