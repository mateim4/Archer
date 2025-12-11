/**
 * Export utilities for Infrastructure Visualizer
 * 
 * Provides functions to export the graph visualization to various formats:
 * - PNG: Raster image export
 * - SVG: Vector image export
 * - PDF: Document export with metadata
 */

import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export type ExportFormat = 'png' | 'svg' | 'pdf';

export interface ExportOptions {
  /** File name without extension */
  fileName?: string;
  /** Export format */
  format: ExportFormat;
  /** Image quality for PNG (0-1) */
  quality?: number;
  /** Include background */
  includeBackground?: boolean;
  /** PDF page size */
  pdfPageSize?: 'a4' | 'letter' | 'legal';
  /** PDF orientation */
  pdfOrientation?: 'portrait' | 'landscape';
}

/**
 * Export the visualization canvas to an image file
 * 
 * @param element - The canvas DOM element to export
 * @param options - Export configuration options
 * @returns Promise that resolves when export is complete
 */
export async function exportVisualization(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const {
    fileName = `infrastructure-diagram-${new Date().toISOString().split('T')[0]}`,
    format,
    quality = 0.95,
    includeBackground = true,
    pdfPageSize = 'a4',
    pdfOrientation = 'landscape',
  } = options;

  try {
    switch (format) {
      case 'png':
        await exportToPNG(element, fileName, quality, includeBackground);
        break;
      case 'svg':
        await exportToSVG(element, fileName, includeBackground);
        break;
      case 'pdf':
        await exportToPDF(element, fileName, pdfPageSize, pdfOrientation, includeBackground);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error(`Failed to export as ${format}:`, error);
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export to PNG format
 */
async function exportToPNG(
  element: HTMLElement,
  fileName: string,
  quality: number,
  includeBackground: boolean
): Promise<void> {
  const dataUrl = await htmlToImage.toPng(element, {
    quality,
    backgroundColor: includeBackground ? '#ffffff' : undefined,
    cacheBust: true,
    pixelRatio: 2, // High DPI for better quality
  });

  downloadFile(dataUrl, `${fileName}.png`);
}

/**
 * Export to SVG format
 */
async function exportToSVG(
  element: HTMLElement,
  fileName: string,
  includeBackground: boolean
): Promise<void> {
  const dataUrl = await htmlToImage.toSvg(element, {
    backgroundColor: includeBackground ? '#ffffff' : undefined,
    cacheBust: true,
  });

  downloadFile(dataUrl, `${fileName}.svg`);
}

/**
 * Export to PDF format
 */
async function exportToPDF(
  element: HTMLElement,
  fileName: string,
  pageSize: 'a4' | 'letter' | 'legal',
  orientation: 'portrait' | 'landscape',
  includeBackground: boolean
): Promise<void> {
  // First, capture as PNG
  const dataUrl = await htmlToImage.toPng(element, {
    quality: 0.95,
    backgroundColor: includeBackground ? '#ffffff' : undefined,
    cacheBust: true,
    pixelRatio: 2,
  });

  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  // Get page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Load image to get dimensions
  const img = new Image();
  img.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      try {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = imgWidth / imgHeight;

        // Calculate dimensions to fit page
        let width = pageWidth - 20; // 10mm margin on each side
        let height = width / ratio;

        if (height > pageHeight - 20) {
          height = pageHeight - 20;
          width = height * ratio;
        }

        // Center on page
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        // Add image to PDF
        pdf.addImage(dataUrl, 'PNG', x, y, width, height);

        // Add metadata
        pdf.setProperties({
          title: fileName,
          subject: 'Infrastructure Diagram',
          author: 'Archer',
          keywords: 'infrastructure, network, visualization',
          creator: 'Archer Infrastructure Visualizer',
        });

        // Download
        pdf.save(`${fileName}.pdf`);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
  });
}

/**
 * Trigger download of a data URL
 */
function downloadFile(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
  link.remove();
}

/**
 * Get the ReactFlow viewport element for export
 * 
 * @param containerRef - Reference to the canvas container
 * @returns The viewport element or null
 */
export function getExportElement(containerRef: React.RefObject<HTMLDivElement>): HTMLElement | null {
  if (!containerRef.current) return null;

  // Find the ReactFlow viewport element
  const viewport = containerRef.current.querySelector('.react-flow__viewport') as HTMLElement;
  return viewport || containerRef.current;
}

/**
 * Copy the current visualization to clipboard as an image
 * 
 * @param element - The canvas DOM element to copy
 */
export async function copyToClipboard(element: HTMLElement): Promise<void> {
  try {
    const blob = await htmlToImage.toBlob(element, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      cacheBust: true,
      pixelRatio: 2,
    });

    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    console.log('Visualization copied to clipboard');
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy to clipboard');
  }
}
