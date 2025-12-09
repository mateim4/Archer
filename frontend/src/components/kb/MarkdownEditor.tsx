import React, { useState } from 'react';
import { PurpleGlassTextarea, PurpleGlassCard } from '../ui';
import { MarkdownRenderer } from './MarkdownRenderer';
import { tokens } from '@fluentui/react-components';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showPreview?: boolean;
  height?: string;
}

/**
 * MarkdownEditor - Split-pane Markdown editor with live preview
 * 
 * Features:
 * - Side-by-side editor and preview
 * - Live preview updates as you type
 * - Fluent UI 2 design tokens
 * - Resizable height
 */
export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your article content in Markdown...',
  showPreview = true,
  height = '500px',
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
      gap: tokens.spacingHorizontalL,
      height,
    }}>
      {/* Editor Pane */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          fontSize: tokens.fontSizeBase300,
          fontWeight: tokens.fontWeightSemibold,
          color: tokens.colorNeutralForeground2,
          marginBottom: tokens.spacingVerticalS,
        }}>
          Editor
        </div>
        <PurpleGlassTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          glassVariant="light"
          style={{
            height: '100%',
            fontFamily: tokens.fontFamilyMonospace,
            fontSize: tokens.fontSizeBase300,
            resize: 'vertical',
          }}
        />
      </div>

      {/* Preview Pane */}
      {showPreview && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{
            fontSize: tokens.fontSizeBase300,
            fontWeight: tokens.fontWeightSemibold,
            color: tokens.colorNeutralForeground2,
            marginBottom: tokens.spacingVerticalS,
          }}>
            Preview
          </div>
          <PurpleGlassCard
            glassVariant="light"
            style={{
              height: '100%',
              overflow: 'auto',
              padding: tokens.spacingVerticalL,
            }}
          >
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: tokens.colorNeutralForeground4,
                fontSize: tokens.fontSizeBase300,
              }}>
                Preview will appear here...
              </div>
            )}
          </PurpleGlassCard>
        </div>
      )}
    </div>
  );
};
