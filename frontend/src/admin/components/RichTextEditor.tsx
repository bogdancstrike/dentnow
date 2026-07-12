import { useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import './richTextEditor.css';

interface RichTextEditorProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({ id, value = '', onChange, placeholder, disabled }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'dent-rich-text-content',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Editor vizual pentru conținut',
        'data-placeholder': placeholder ?? 'Scrie conținutul aici…',
      },
    },
    onUpdate: ({ editor: current }) => onChange?.(current.getMarkdown()),
  });

  useEffect(() => {
    if (!editor || editor.getMarkdown() === value) return;
    editor.commands.setContent(value || '', { contentType: 'markdown', emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  const addLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('Adresa linkului (https://…)', previous ?? 'https://');
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  };

  const tool = (label: string, active: boolean, action: () => void, icon: React.ReactNode) => (
    <Tooltip title={label}>
      <Button
        type={active ? 'primary' : 'text'}
        size="small"
        aria-label={label}
        aria-pressed={active}
        icon={icon}
        onClick={action}
        disabled={disabled}
      />
    </Tooltip>
  );

  return (
    <div className={`dent-rich-text${disabled ? ' is-disabled' : ''}`}>
      <div className="dent-rich-text-toolbar" role="toolbar" aria-label="Formatare text">
        {tool('Text normal', editor.isActive('paragraph'), () => editor.chain().focus().setParagraph().run(), <span className="dent-rich-text-aa">Aa</span>)}
        {tool('Subtitlu', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <span className="dent-rich-text-heading">H2</span>)}
        {tool('Titlu mic', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <span className="dent-rich-text-heading">H3</span>)}
        <span className="dent-rich-text-separator" />
        {tool('Aldin', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <BoldOutlined />)}
        {tool('Cursiv', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <ItalicOutlined />)}
        {tool('Tăiat', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), <StrikethroughOutlined />)}
        {tool('Link', editor.isActive('link'), addLink, <LinkOutlined />)}
        <span className="dent-rich-text-separator" />
        {tool('Listă cu marcatori', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <UnorderedListOutlined />)}
        {tool('Listă numerotată', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <OrderedListOutlined />)}
        {tool('Citat', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), <span className="dent-rich-text-quote">“</span>)}
        <span className="dent-rich-text-toolbar-spacer" />
        <Tooltip title="Anulează">
          <Button size="small" type="text" aria-label="Anulează" icon={<UndoOutlined />} disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
        </Tooltip>
        <Tooltip title="Refă">
          <Button size="small" type="text" aria-label="Refă" icon={<RedoOutlined />} disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
        </Tooltip>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
