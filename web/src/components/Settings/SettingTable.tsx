import React from "react";
import { cn } from "@/lib/utils";

interface SettingTableColumn<T = Record<string, unknown>> {
  key: string;
  header: React.ReactNode;
  className?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface SettingTableProps<T = Record<string, unknown>> {
  columns: SettingTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  getRowKey?: (row: T, index: number) => string;
  variant?: "default" | "info-flow";
}

const SettingTable = <T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data",
  className,
  getRowKey,
  variant = "default",
}: SettingTableProps<T>) => {
  const renderCell = (column: SettingTableColumn<T>, row: T) => {
    const value = row[column.key as keyof T] as T[keyof T];
    return column.render ? column.render(value, row) : (value as React.ReactNode);
  };

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="gc-setting-table-compact" aria-label="Settings list">
        {data.length === 0 ? (
          <div className="gc-setting-table-card px-4 py-5 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          data.map((row, rowIndex) => {
            const rowKey = getRowKey ? getRowKey(row, rowIndex) : rowIndex.toString();
            return (
              <article key={rowKey} className="gc-setting-table-card">
                {columns.map((column) => {
                  const hasHeader = column.header !== "" && column.header !== null && column.header !== undefined;
                  return (
                    <div
                      key={column.key}
                      className={cn("gc-setting-table-card-field text-sm text-muted-foreground", !hasHeader && "gc-setting-table-card-actions")}
                    >
                      {hasHeader ? <div className="gc-setting-table-card-label">{column.header}</div> : null}
                      <div className="min-w-0">{renderCell(column, row)}</div>
                    </div>
                  );
                })}
              </article>
            );
          })
        )}
      </div>

      <div className="gc-setting-table-expanded w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle border border-border rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="text-sm font-semibold text-left text-foreground">
                {columns.map((column) => (
                  <th key={column.key} scope="col" className={cn("px-3 py-2", column.className)}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-4 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => {
                  const rowKey = getRowKey ? getRowKey(row, rowIndex) : rowIndex.toString();
                  return (
                    <tr key={rowKey}>
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-3 text-sm text-muted-foreground",
                            variant === "default" ? "whitespace-nowrap py-2" : "py-3 align-top whitespace-normal",
                            column.className,
                          )}
                        >
                          {renderCell(column, row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingTable;
