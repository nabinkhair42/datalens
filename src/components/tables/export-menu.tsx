'use client';

import { DownloadIcon, FileJsonIcon, FileSpreadsheetIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportMenuProps {
  data: Record<string, unknown>[];
  columns: string[];
  filename?: string;
  disabled?: boolean;
}

export const ExportMenu = memo(function ExportMenu({
  data,
  columns,
  filename = 'export',
  disabled,
}: ExportMenuProps) {
  const downloadFile = useCallback(
    (content: string, extension: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [filename],
  );

  const exportCSV = useCallback(() => {
    if (data.length === 0) {
      return;
    }

    const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = columns.map(escapeCSV).join(',');
    const rows = data.map((row) => columns.map((col) => escapeCSV(row[col])).join(','));
    const csv = [header, ...rows].join('\n');

    downloadFile(csv, 'csv', 'text/csv;charset=utf-8;');
  }, [data, columns, downloadFile]);

  const exportJSON = useCallback(() => {
    if (data.length === 0) {
      return;
    }

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'json', 'application/json');
  }, [data, downloadFile]);

  const hasData = data.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={disabled || !hasData}>
            <DownloadIcon className="size-4" />
            Export
          </Button>
        }
      />
      <DropdownMenuContent align="end" className={'w-40'}>
        <DropdownMenuItem className="gap-2" onSelect={exportCSV}>
          <FileSpreadsheetIcon className="size-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onSelect={exportJSON}>
          <FileJsonIcon className="size-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
