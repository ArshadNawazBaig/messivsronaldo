/* eslint-disable @next/next/no-img-element -- The upload endpoint already resizes and encodes images. */
import { Fragment, type ReactNode } from "react";
import { safeImage, safeLink, type RichNode } from "@/lib/blog/model";
import { articleHeadingId } from "@/lib/blog/headings";
import styles from "./rich-body.module.css";

function render(node: RichNode, key: string): ReactNode {
  const content = node.content?.map((child, index) => render(child, `${key}-${index}`));
  if (node.type === "text") {
    let text: ReactNode = node.text;
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") text = <strong>{text}</strong>;
      if (mark.type === "italic") text = <em>{text}</em>;
      if (mark.type === "underline") text = <u>{text}</u>;
      if (mark.type === "strike") text = <s>{text}</s>;
      if (mark.type === "code") text = <code>{text}</code>;
      if (mark.type === "link" && safeLink(String(mark.attrs?.href ?? ""))) text = <a href={String(mark.attrs?.href)} rel="noopener noreferrer">{text}</a>;
    }
    return <Fragment key={key}>{text}</Fragment>;
  }
  switch (node.type) {
    case "doc": return <Fragment key={key}>{content}</Fragment>;
    case "paragraph": return <p key={key}>{content ?? <br/>}</p>;
    case "heading": return node.attrs?.level === 3 ? <h3 key={key} id={articleHeadingId(key)}>{content}</h3> : node.attrs?.level === 4 ? <h4 key={key} id={articleHeadingId(key)}>{content}</h4> : <h2 key={key} id={articleHeadingId(key)}>{content}</h2>;
    case "bulletList": return <ul key={key}>{content}</ul>;
    case "orderedList": return <ol key={key} start={Number(node.attrs?.start) || 1}>{content}</ol>;
    case "listItem": return <li key={key}>{content}</li>;
    case "blockquote": return <blockquote key={key}>{content}</blockquote>;
    case "codeBlock": return <pre key={key}><code>{content}</code></pre>;
    case "hardBreak": return <br key={key}/>;
    case "horizontalRule": return <hr key={key}/>;
    case "image": return safeImage(String(node.attrs?.src ?? "")) ? <figure key={key}>{/* Uploaded images have already been resized and encoded on the server. */}<img src={String(node.attrs?.src)} alt={String(node.attrs?.alt ?? "")} loading="lazy"/>{node.attrs?.title ? <figcaption>{String(node.attrs.title)}</figcaption> : null}</figure> : null;
    case "table": return <div className={styles.table} key={key} role="region" aria-label="Article table" tabIndex={0}><table><tbody>{content}</tbody></table></div>;
    case "tableRow": return <tr key={key}>{content}</tr>;
    case "tableHeader": return <th key={key} colSpan={Number(node.attrs?.colspan) || 1} rowSpan={Number(node.attrs?.rowspan) || 1}>{content}</th>;
    case "tableCell": return <td key={key} colSpan={Number(node.attrs?.colspan) || 1} rowSpan={Number(node.attrs?.rowspan) || 1}>{content}</td>;
    default: return null;
  }
}
export function RichBody({ body }: { body: RichNode }) { return <div className={styles.body}>{render(body, "body")}</div>; }
