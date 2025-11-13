import React from 'react';
import { ChevronLeftRegular, ChevronRightRegular, ChevronDoubleLeftRegular, ChevronDoubleRightRegular } from '@fluentui/react-icons';
import { DesignTokens } from '../../styles/designSystem';
import { PurpleGlassButton } from './PurpleGlassButton';
import { PurpleGlassDropdown } from './PurpleGlassDropdown';

export interface PurpleGlassPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

export const PurpleGlassPagination: React.FC<PurpleGlassPaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [25, 50, 100, 200]
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
     
      if (currentPage > 3) {
        pages.push('...');
      }
     
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
     
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
     
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
     
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: DesignTokens.spacing.lg,
      flexWrap: 'wrap',
      gap: DesignTokens.spacing.md,
      fontFamily: DesignTokens.typography.fontFamily
    }}>
      {/* Items per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
        <span style={{ fontSize: DesignTokens.typography.sm, color: DesignTokens.colors.textSecondary }}>
          Items per page:
        </span>
        <PurpleGlassDropdown
          options={itemsPerPageOptions.map(num => ({ value: String(num), label: String(num) }))}
          value={String(itemsPerPage)}
          onChange={(value) => onItemsPerPageChange(Number(value))}
          glass="light"
        />
      </div>

      {/* Page info */}
      <div style={{ fontSize: DesignTokens.typography.sm, color: DesignTokens.colors.textSecondary }}>
        {startItem}-{endItem} of {totalItems} items
      </div>

      {/* Page navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.xs }}>
        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronDoubleLeftRegular />}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        />
        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronLeftRegular />}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        />

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: DesignTokens.colors.textMuted }}>
              ...
            </span>
          ) : (
            <PurpleGlassButton
              key={page}
              variant={currentPage === page ? 'primary' : 'ghost'}
              size="small"
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </PurpleGlassButton>
          )
        ))}

        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronRightRegular />}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        />
        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronDoubleRightRegular />}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        />
      </div>
    </div>
  );
};
