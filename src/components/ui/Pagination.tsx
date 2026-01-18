import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
}: PaginationProps) => {
  const canGoPrevious = hasPreviousPage ?? currentPage > 1;
  const canGoNext = hasNextPage ?? currentPage < totalPages;

  const getVisiblePages = () => {
    if (totalPages <= 1) return [];

    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    // Si hay pocas páginas, mostrar todas
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Siempre mostrar la primera página
    if (currentPage > delta + 2) {
      rangeWithDots.push(1, '...');
    } else {
      for (let i = 1; i < Math.max(2, currentPage - delta); i++) {
        rangeWithDots.push(i);
      }
    }

    // Páginas alrededor de la actual
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      rangeWithDots.push(i);
    }

    // Siempre mostrar la última página
    if (currentPage < totalPages - delta - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      for (
        let i = Math.max(currentPage + delta + 1, totalPages);
        i <= totalPages;
        i++
      ) {
        if (!rangeWithDots.includes(i)) {
          rangeWithDots.push(i);
        }
      }
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {/* Mobile pagination */}
      <div className="flex justify-between flex-1 sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          size="sm"
        >
          Anterior
        </Button>
        <span className="text-sm text-gray-700 flex items-center">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          size="sm"
        >
          Siguiente
        </Button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Página <span className="font-medium">{currentPage}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canGoPrevious}
              className={`
                relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 
                bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 
                ${
                  !canGoPrevious
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:text-gray-700'
                }
              `}
            >
              <span className="sr-only">Anterior</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {getVisiblePages().map((page, index) => (
              <button
                key={`page-${index}`}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={`
                  relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors
                  ${
                    page === currentPage
                      ? 'z-10 bg-blue-600 border-blue-600 text-white'
                      : page === '...'
                      ? 'bg-white border-gray-300 text-gray-700 cursor-default'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }
                `}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className={`
                relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 
                bg-white text-sm font-medium text-gray-500 hover:bg-gray-50
                ${
                  !canGoNext
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:text-gray-700'
                }
              `}
            >
              <span className="sr-only">Siguiente</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
