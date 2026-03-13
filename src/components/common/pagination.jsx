import { ArrowIL, ArrowIR } from "../../assets/icon/index";

const CustomPagination = ({
  pageNumber,
  setPageNumber,
  totalItems,
  itemsPerPage,
  handlePageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePrevious = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
      handlePageChange(pageNumber - 1);
    }
  };

  const handleNext = () => {
    if (pageNumber < totalPages) {
      setPageNumber(pageNumber + 1);
      handlePageChange(pageNumber + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPageButtons = 5;

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (pageNumber > 3) {
        pages.push("...");
      }
      const startPage = Math.max(2, pageNumber - 1);
      const endPage = Math.min(totalPages - 1, pageNumber + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (pageNumber < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      <div className="flex gap-1">
        <button
          onClick={handlePrevious}
          disabled={pageNumber === 1}
          className="flex gap-2 text-sm items-center px-2 max-sm:pr-3 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-[--light-3] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowIL className="w-4" /> Önceki
        </button>
        <div className="flex sm:gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={index} className="p-2 text-sm">
                ...
              </span>
            ) : (
              <button
                key={index}
                className={`py-2 px-4 text-sm border-2 border-solid hover:border-[--border-1] rounded-md ${
                  pageNumber === page
                    ? "border-[--border-1]"
                    : "border-transparent"
                }`}
                onClick={() => {
                  setPageNumber(page);
                  handlePageChange(page);
                }}
              >
                {page}
              </button>
            ),
          )}
        </div>
        <button
          onClick={handleNext}
          disabled={pageNumber === totalPages}
          className="flex gap-2 text-sm items-center px-2 max-sm:pr-3 sm:px-4 py-2 rounded-md hover:bg-[--light-3] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sonraki
          <ArrowIR className="w-4" />
        </button>
      </div>
    </div>
  );
};

export default CustomPagination;
