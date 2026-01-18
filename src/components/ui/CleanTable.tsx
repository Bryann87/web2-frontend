import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CleanTableProps extends HTMLAttributes<HTMLTableElement> {}

export const CleanTable = forwardRef<HTMLTableElement, CleanTableProps>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto rounded-lg border border-gray-200 bg-white">
      <table
        ref={ref}
        className={clsx(
          'w-full caption-bottom text-sm border-collapse',
          className
        )}
        {...props}
      />
    </div>
  )
);

CleanTable.displayName = 'CleanTable';

interface CleanTableHeaderProps
  extends HTMLAttributes<HTMLTableSectionElement> {}

export const CleanTableHeader = forwardRef<
  HTMLTableSectionElement,
  CleanTableHeaderProps
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={clsx('bg-gray-50', className)} {...props} />
));

CleanTableHeader.displayName = 'CleanTableHeader';

interface CleanTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const CleanTableBody = forwardRef<
  HTMLTableSectionElement,
  CleanTableBodyProps
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={clsx('bg-white', className)} {...props} />
));

CleanTableBody.displayName = 'CleanTableBody';

interface CleanTableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

export const CleanTableRow = forwardRef<
  HTMLTableRowElement,
  CleanTableRowProps
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={clsx(
      'border-b border-gray-100 transition-colors hover:bg-gray-50',
      className
    )}
    {...props}
  />
));

CleanTableRow.displayName = 'CleanTableRow';

interface CleanTableHeadProps extends HTMLAttributes<HTMLTableCellElement> {}

export const CleanTableHead = forwardRef<
  HTMLTableCellElement,
  CleanTableHeadProps
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={clsx(
      'h-12 px-4 text-left align-middle font-medium text-gray-700 text-sm',
      className
    )}
    {...props}
  />
));

CleanTableHead.displayName = 'CleanTableHead';

interface CleanTableCellProps extends HTMLAttributes<HTMLTableCellElement> {}

export const CleanTableCell = forwardRef<
  HTMLTableCellElement,
  CleanTableCellProps
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={clsx('px-4 py-3 align-middle text-sm text-gray-900', className)}
    {...props}
  />
));

CleanTableCell.displayName = 'CleanTableCell';
