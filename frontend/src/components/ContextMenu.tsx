import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Eye, Code, Download } from 'lucide-react';

interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  targetElement?: HTMLElement | null;
  customItems?: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  onClose,
  targetElement,
  customItems = []
}) => {
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (visible) {
      // Ensure menu doesn't go off-screen
      const menuWidth = 200;
      const menuHeight = 150; // Approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + menuWidth > viewportWidth) {
        adjustedX = x - menuWidth;
      }

      if (y + menuHeight > viewportHeight) {
        adjustedY = y - menuHeight;
      }

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [visible, x, y]);

  const copyElementText = useCallback(async () => {
    if (!targetElement) return;

    let textToCopy = '';

    // Handle different types of elements
    if (targetElement.tagName === 'PRE' || targetElement.closest('pre')) {
      // Code block
      const codeElement = targetElement.tagName === 'PRE' ? targetElement : targetElement.closest('pre');
      textToCopy = codeElement?.textContent || '';
    } else if (targetElement.closest('#mermaid-diagram')) {
      // Mermaid diagram - for SVG content, we provide a helpful message
      textToCopy = 'This is a rendered Mermaid diagram. Use "Copy Mermaid Code" from the context menu or switch to Code view to copy the diagram source.';
    } else if (targetElement.closest('.lcm-table-row, .lcm-table-header')) {
      // Table row/cell
      const tableElement = targetElement.closest('.lcm-table-row, .lcm-table-header');
      textToCopy = tableElement?.textContent || '';
    } else {
      // Generic text content
      textToCopy = targetElement.textContent || targetElement.innerText || '';
    }

    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy.trim());
        console.log('Text copied to clipboard');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }

    onClose();
  }, [targetElement, onClose]);

  const copyElementHTML = useCallback(async () => {
    if (!targetElement) return;

    try {
      await navigator.clipboard.writeText(targetElement.outerHTML);
      console.log('HTML copied to clipboard');
    } catch (err) {
      console.error('Failed to copy HTML: ', err);
    }

    onClose();
  }, [targetElement, onClose]);

  const inspectElement = useCallback(() => {
    if (targetElement) {
      console.log('Element details:', {
        tagName: targetElement.tagName,
        className: targetElement.className,
        id: targetElement.id,
        textContent: targetElement.textContent,
        outerHTML: targetElement.outerHTML
      });
    }
    onClose();
  }, [targetElement, onClose]);

  const defaultItems: ContextMenuItem[] = [
    {
      id: 'copy-text',
      label: 'Copy Text',
      icon: <Copy size={16} />,
      action: copyElementText
    },
    {
      id: 'copy-html',
      label: 'Copy HTML',
      icon: <Code size={16} />,
      action: copyElementHTML
    },
    {
      id: 'inspect',
      label: 'Inspect Element',
      icon: <Eye size={16} />,
      action: inspectElement
    }
  ];

  const allItems = [...customItems, ...defaultItems];

  if (!visible) return null;

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 15000 }}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Context Menu */}
      <div
        className="fixed purple-glass-card rounded-lg shadow-lg py-2 min-w-[180px]"
        style={{
          left: position.x,
          top: position.y,
          zIndex: 15001,
          fontFamily: 'var(--font-family)',
          fontSize: '14px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {allItems.map((item, index) => (
          <button
            key={item.id}
            onClick={item.action}
            disabled={item.disabled}
            className={`
              w-full flex items-center gap-3 px-4 py-2 text-left text-sm
              transition-colors
              ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{
              borderTop: index > 0 ? '1px solid var(--card-border)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = 'var(--glass-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
            <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
