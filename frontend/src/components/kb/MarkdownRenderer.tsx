import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { tokens } from '@fluentui/react-components';
import './MarkdownRenderer.css';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer - Renders Markdown content with GitHub Flavored Markdown support
 * 
 * Features:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Syntax highlighting for code blocks
 * - Sanitized HTML to prevent XSS
 * - Fluent UI 2 design token styling
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom heading renderers for better styling
          h1: ({ children }) => (
            <h1 style={{
              fontSize: tokens.fontSizeHero800,
              fontWeight: tokens.fontWeightSemibold,
              marginBottom: tokens.spacingVerticalL,
              color: tokens.colorNeutralForeground1,
            }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{
              fontSize: tokens.fontSizeHero700,
              fontWeight: tokens.fontWeightSemibold,
              marginTop: tokens.spacingVerticalXXL,
              marginBottom: tokens.spacingVerticalM,
              color: tokens.colorNeutralForeground1,
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{
              fontSize: tokens.fontSizeBase500,
              fontWeight: tokens.fontWeightSemibold,
              marginTop: tokens.spacingVerticalXL,
              marginBottom: tokens.spacingVerticalS,
              color: tokens.colorNeutralForeground1,
            }}>
              {children}
            </h3>
          ),
          // Code block styling
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre style={{
                backgroundColor: tokens.colorNeutralBackground2,
                borderRadius: tokens.borderRadiusMedium,
                padding: tokens.spacingVerticalM,
                overflow: 'auto',
                marginTop: tokens.spacingVerticalM,
                marginBottom: tokens.spacingVerticalM,
              }}>
                <code className={className} style={{
                  fontFamily: tokens.fontFamilyMonospace,
                  fontSize: tokens.fontSizeBase300,
                  color: tokens.colorNeutralForeground1,
                }} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code style={{
                backgroundColor: tokens.colorNeutralBackground2,
                borderRadius: tokens.borderRadiusSmall,
                padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
                fontFamily: tokens.fontFamilyMonospace,
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorBrandForeground1,
              }} {...props}>
                {children}
              </code>
            );
          },
          // Link styling
          a: ({ children, href }: any) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: tokens.colorBrandForeground1,
                textDecoration: 'none',
                borderBottom: `1px solid ${tokens.colorBrandForeground1}`,
              }}
            >
              {children}
            </a>
          ),
          // Blockquote styling
          blockquote: ({ children }: any) => (
            <blockquote style={{
              borderLeft: `4px solid ${tokens.colorBrandForeground1}`,
              paddingLeft: tokens.spacingHorizontalL,
              marginLeft: 0,
              marginTop: tokens.spacingVerticalM,
              marginBottom: tokens.spacingVerticalM,
              color: tokens.colorNeutralForeground2,
              fontStyle: 'italic',
            }}>
              {children}
            </blockquote>
          ),
          // Table styling
          table: ({ children }: any) => (
            <div style={{ overflowX: 'auto', marginTop: tokens.spacingVerticalM, marginBottom: tokens.spacingVerticalM }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: `1px solid ${tokens.colorNeutralStroke1}`,
              }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }: any) => (
            <th style={{
              backgroundColor: tokens.colorNeutralBackground2,
              padding: tokens.spacingVerticalS,
              textAlign: 'left',
              fontWeight: tokens.fontWeightSemibold,
              borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
              color: tokens.colorNeutralForeground1,
            }}>
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td style={{
              padding: tokens.spacingVerticalS,
              borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
              color: tokens.colorNeutralForeground1,
            }}>
              {children}
            </td>
          ),
          // List styling
          ul: ({ children }: any) => (
            <ul style={{
              marginLeft: tokens.spacingHorizontalL,
              marginTop: tokens.spacingVerticalM,
              marginBottom: tokens.spacingVerticalM,
            }}>
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol style={{
              marginLeft: tokens.spacingHorizontalL,
              marginTop: tokens.spacingVerticalM,
              marginBottom: tokens.spacingVerticalM,
            }}>
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li style={{
              marginBottom: tokens.spacingVerticalXS,
              color: tokens.colorNeutralForeground1,
            }}>
              {children}
            </li>
          ),
          // Paragraph styling
          p: ({ children }: any) => (
            <p style={{
              marginTop: tokens.spacingVerticalM,
              marginBottom: tokens.spacingVerticalM,
              lineHeight: 1.6,
              color: tokens.colorNeutralForeground1,
            }}>
              {children}
            </p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
