"use client";

import { useEffect, useState } from 'react';
import { type Editor } from '@tiptap/react';
import { Card } from '@/components/ui/card';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Table,
  Minus,
} from 'lucide-react';

interface SlashCommandProps {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<string>;
  onOpenMediaPicker?: () => void;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: () => void;
}

export function SlashCommand({ editor, onImageUpload, onOpenMediaPicker }: SlashCommandProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImageUpload = () => {
    // Prioritize Media Picker if available
    if (onOpenMediaPicker) {
      onOpenMediaPicker();
      setShowMenu(false);
      return;
    }

    // Fallback to file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImageUpload) {
        try {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Image upload failed:', error);
        }
      }
    };
    input.click();
  };

  const commands: CommandItem[] = [
    {
      title: 'Tiêu đề 1',
      description: 'Tiêu đề lớn',
      icon: <Heading1 className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Tiêu đề 2',
      description: 'Tiêu đề trung bình',
      icon: <Heading2 className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Tiêu đề 3',
      description: 'Tiêu đề nhỏ',
      icon: <Heading3 className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Danh sách',
      description: 'Danh sách bullet',
      icon: <List className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: 'Danh sách số',
      description: 'Danh sách đánh số',
      icon: <ListOrdered className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: 'Trích dẫn',
      description: 'Blockquote',
      icon: <Quote className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: 'Code block',
      description: 'Khối code',
      icon: <Code className="h-4 w-4" />,
      command: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: 'Ảnh',
      description: 'Upload ảnh',
      icon: <ImageIcon className="h-4 w-4" />,
      command: handleImageUpload,
    },
    {
      title: 'Đường kẻ ngang',
      description: 'Horizontal rule',
      icon: <Minus className="h-4 w-4" />,
      command: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleUpdate = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      const text = $from.nodeBefore?.text || '';

      // Check if user typed '/'
      if (text.endsWith('/')) {
        const coords = editor.view.coordsAtPos($from.pos);
        setMenuPosition({
          top: coords.top + window.scrollY + 20,
          left: coords.left + window.scrollX,
        });
        setShowMenu(true);
        setSearchQuery('');
        setSelectedIndex(0);
      } else if (showMenu) {
        // Extract search query after '/'
        const match = text.match(/\/([^/]*)$/);
        if (match) {
          setSearchQuery(match[1]);
        } else {
          setShowMenu(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showMenu) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command) {
          // Delete the '/' and search query
          const { selection } = editor.state;
          const { $from } = selection;
          const text = $from.nodeBefore?.text || '';
          const match = text.match(/\/([^/]*)$/);
          if (match) {
            const deleteLength = match[0].length;
            editor
              .chain()
              .deleteRange({
                from: $from.pos - deleteLength,
                to: $from.pos,
              })
              .run();
          }
          command.command();
          setShowMenu(false);
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setShowMenu(false);
        return;
      }
    };

    editor.on('update', handleUpdate);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.off('update', handleUpdate);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, showMenu, selectedIndex, filteredCommands]);

  if (!showMenu || filteredCommands.length === 0) {
    return null;
  }

  return (
    <Card
      className="fixed z-50 w-72 max-h-80 overflow-y-auto shadow-lg"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
    >
      <div className="p-2">
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.title}
            type="button"
            className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 hover:bg-accent transition-colors ${
              index === selectedIndex ? 'bg-accent' : ''
            }`}
            onClick={() => {
              // Delete the '/' and search query
              const { selection } = editor.state;
              const { $from } = selection;
              const text = $from.nodeBefore?.text || '';
              const match = text.match(/\/([^/]*)$/);
              if (match) {
                const deleteLength = match[0].length;
                editor
                  .chain()
                  .deleteRange({
                    from: $from.pos - deleteLength,
                    to: $from.pos,
                  })
                  .run();
              }
              cmd.command();
              setShowMenu(false);
            }}
          >
            <div className="flex-shrink-0">{cmd.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{cmd.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {cmd.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
