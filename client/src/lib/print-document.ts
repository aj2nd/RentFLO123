export function openPrintDocument(title: string, css: string, width: number, height: number) {
  const win = window.open("", "_blank", `width=${width},height=${height}`);
  if (!win) return null;
  const doc = win.document;
  doc.title = title;
  doc.head.replaceChildren();
  doc.body.replaceChildren();
  const style = doc.createElement("style");
  style.textContent = css;
  doc.head.append(style);
  return { win, doc, body: doc.body };
}

export function appendTextElement<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  parent: HTMLElement,
  tagName: K,
  text: unknown,
  className?: string,
) {
  const element = doc.createElement(tagName);
  if (className) element.className = className;
  element.textContent = String(text ?? "");
  parent.append(element);
  return element;
}

export function appendDivider(doc: Document, parent: HTMLElement, className = "divider") {
  const divider = doc.createElement("hr");
  divider.className = className;
  parent.append(divider);
  return divider;
}
