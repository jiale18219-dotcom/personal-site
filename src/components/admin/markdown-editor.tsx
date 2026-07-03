"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  codeBlockPlugin,
  headingsPlugin,
  imagePlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { useState } from "react";

type MarkdownEditorProps = {
  name: string;
  initialMarkdown: string;
};

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Image upload failed.");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export function MarkdownEditor({ name, initialMarkdown }: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);

  return (
    <div className="admin-markdown-editor">
      <input type="hidden" name={name} value={markdown} />
      <MDXEditor
        markdown={initialMarkdown}
        onChange={setMarkdown}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
          imagePlugin({ imageUploadHandler: uploadImage }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <ListsToggle />
                <CreateLink />
                <InsertThematicBreak />
                <InsertImage />
                <InsertTable />
                <InsertCodeBlock />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
