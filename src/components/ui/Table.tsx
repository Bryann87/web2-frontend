import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={clsx(
        'w-full caption-bottom text-sm border-collapse bg-white',
        className,
      )}
      {...props}
    />
  ),
);

Table.displayName = 'Table';

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={clsx(
      'table-header-elegant [&_tr]:border-b [&_tr]:border-slate-600',
      className,
    )}
    {...props}
  />
));

TableHeader.displayName = 'TableHeader';

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={clsx(
        'table-body-elegant [&_tr:last-child]:border-0',
        className,
      )}
      {...props}
    />
  ),
);

TableBody.displayName = 'TableBody';

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={clsx(
        'bg-white border-b border-gray-100 transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100',
        className,
      )}
      {...props}
    />
  ),
);

TableRow.displayName = 'TableRow';

interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  colSpan?: number;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={clsx(
        'h-10 px-3 text-left align-middle font-semibold text-sm [&:has([role=checkbox])]:pr-0 table-header-text-white',
        className,
      )}
      {...props}
    />
  ),
);

TableHead.displayName = 'TableHead';

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  colSpan?: number;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={clsx(
        'px-3 py-2 align-middle text-sm text-slate-900 [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
);

TableCell.displayName = 'TableCell';
// Componente para botones de acción más pequeños
interface ActionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'edit' | 'delete' | 'view' | 'toggle' | 'warning' | 'success';
  size?: 'sm' | 'xs';
  disabled?: boolean;
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    { className, variant = 'edit', size = 'xs', disabled, children, ...props },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const sizeClasses = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-7 w-7 text-sm px-1',
    };

    const variantClasses = {
      edit: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:ring-blue-500',
      delete:
        'text-red-600 hover:text-red-800 hover:bg-red-50 focus:ring-red-500',
      view: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 focus:ring-gray-500',
      toggle:
        'text-green-600 hover:text-green-800 hover:bg-green-50 focus:ring-green-500',
      warning:
        'text-orange-600 hover:text-orange-800 hover:bg-orange-50 focus:ring-orange-500',
      success:
        'text-green-600 hover:text-green-800 hover:bg-green-50 focus:ring-green-500',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

ActionButton.displayName = 'ActionButton';
