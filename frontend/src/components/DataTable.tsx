import React from 'react';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  searchComponent?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function DataTable({
  columns,
  data,
  title,
  searchComponent,
  emptyMessage = 'No data found',
  className = ''
}: DataTableProps) {
  return (
    <div className={`bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      {(title || searchComponent) && (
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ">
          {title && <h3 className="text-base sm:text-lg font-bold text-[#191C1E]">{title}</h3>}
          {searchComponent}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="space-y-3">
          {/* Header Row */}
          <div className={`grid gap-4 px-6 py-3 text-xs font-semibold text-[#505F76] uppercase `} 
               style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
            {columns.map((column) => (
              <div 
                key={column.key} 
                className={`${
                  column.align === 'center' ? 'text-center' : 
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.label}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {data.map((row, index) => (
            <div 
              key={index} 
              className={`grid gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0`}
              style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
            >
              {columns.map((column) => (
                <div 
                  key={column.key}
                  className={`${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </div>
              ))}
            </div>
          ))}
          
          {/* Empty State */}
          {data.length === 0 && (
            <div className="px-6 py-12 text-center text-[#505F76] text-sm">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}