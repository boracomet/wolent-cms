import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

interface MinimalTiptapProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function MinimalTiptap({ content, onChange, placeholder = 'Write something...' }: MinimalTiptapProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline hover:text-blue-300',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px] px-4 py-3 dark:prose-invert',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-stone-200/85 dark:border-zinc-800/50 rounded-lg overflow-hidden bg-white/75 dark:bg-zinc-950/50 backdrop-blur-sm">
      {/* Toolbar — dar ekranda yatay kaydırma; genişte sarma */}
      <div className="border-b border-stone-200/85 dark:border-zinc-800/50 bg-stone-50/85 dark:bg-zinc-900/30 overflow-x-auto overscroll-x-contain touch-pan-x">
        <div className="flex flex-nowrap gap-1 p-2 min-w-min sm:flex-wrap sm:min-w-0">
        {/* Text Formatting */}
        <div className="flex gap-1 pr-2 border-r border-stone-200/85 dark:border-zinc-800/50">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors disabled:opacity-50 ${
              editor.isActive('bold') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors disabled:opacity-50 ${
              editor.isActive('italic') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors disabled:opacity-50 ${
              editor.isActive('underline') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors disabled:opacity-50 ${
              editor.isActive('strike') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors disabled:opacity-50 ${
              editor.isActive('code') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 pr-2 border-r border-stone-200/85 dark:border-zinc-800/50">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 pr-2 border-r border-stone-200/85 dark:border-zinc-800/50">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive('bulletList') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive('orderedList') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive('blockquote') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 pr-2 border-r border-stone-200/85 dark:border-zinc-800/50">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Link & Image */}
        <div className="flex gap-1 pr-2 border-r border-stone-200/85 dark:border-zinc-800/50">
          <button
            onClick={setLink}
            className={`p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors ${
              editor.isActive('link') ? 'bg-stone-200/95 dark:bg-zinc-800/70 text-blue-400' : ''
            }`}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors"
            title="Add Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors disabled:opacity-50"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-stone-200/90 active:bg-stone-300/65 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/65 transition-colors disabled:opacity-50"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}