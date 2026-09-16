import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

type Props = { value: string; onChange: (html: string) => void };

const tools = [
  { label: "Paragraph", icon: Pilcrow, command: "formatBlock", value: "p" },
  { label: "Heading 2", icon: Heading2, command: "formatBlock", value: "h2" },
  { label: "Heading 3", icon: Heading3, command: "formatBlock", value: "h3" },
  { label: "Bold", icon: Bold, command: "bold" },
  { label: "Italic", icon: Italic, command: "italic" },
  { label: "Quote", icon: Quote, command: "formatBlock", value: "blockquote" },
  { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
  { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
  { label: "Code block", icon: Code2, command: "formatBlock", value: "pre" },
  { label: "Undo", icon: Undo2, command: "undo" },
  { label: "Redo", icon: Redo2, command: "redo" },
];

export function RichTextEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  const run = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  };

  const addLink = () => {
    const url = window.prompt("Paste the link URL");
    if (!url) return;
    run("createLink", url);
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) return;
    run("insertImage", url);
    setImageUrl("");
    setShowImage(false);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50">
        {tools.map(({ label, icon: Icon, command, value: commandValue }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(command, commandValue)}
            className="grid size-9 cursor-pointer place-items-center rounded-lg text-gray-600 hover:bg-white hover:text-primary dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Icon size={17} />
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
        <button type="button" title="Add link" aria-label="Add link" onMouseDown={(event) => event.preventDefault()} onClick={addLink} className="grid size-9 cursor-pointer place-items-center rounded-lg text-gray-600 hover:bg-white hover:text-primary dark:text-gray-300 dark:hover:bg-gray-700"><Link2 size={17} /></button>
        <button type="button" title="Add image" aria-label="Add image" onMouseDown={(event) => event.preventDefault()} onClick={() => setShowImage((current) => !current)} className="grid size-9 cursor-pointer place-items-center rounded-lg text-gray-600 hover:bg-white hover:text-primary dark:text-gray-300 dark:hover:bg-gray-700"><ImagePlus size={17} /></button>
      </div>
      {showImage && (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-blue-50/60 p-3 dark:border-gray-700 dark:bg-blue-950/20">
          <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste a public image URL" className="min-w-[220px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-900" />
          <button type="button" onClick={addImage} disabled={!/^https?:\/\//i.test(imageUrl.trim())} className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">Insert image</button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Blog content"
        data-placeholder="Tell your story…"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="blog-rich-editor min-h-[520px] px-6 py-8 text-base leading-8 text-gray-800 outline-none dark:text-gray-100 sm:px-12"
      />
    </section>
  );
}
