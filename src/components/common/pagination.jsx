import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CornerDownLeft } from "lucide-react";
import { ArrowIL, ArrowIR } from "../../assets/icon/index";

const CustomPagination = ({
  pageNumber,
  setPageNumber,
  totalItems,
  itemsPerPage,
  handlePageChange,
}) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpValue, setJumpValue] = useState("");

  const goTo = (raw) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(Math.max(1, n), totalPages);
    if (clamped === pageNumber) {
      setJumpValue("");
      return;
    }
    setPageNumber(clamped);
    handlePageChange(clamped);
    setJumpValue("");
  };

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
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <div className="flex gap-1">
        <button
          onClick={handlePrevious}
          disabled={pageNumber === 1}
          className="flex gap-2 text-sm items-center px-2 max-sm:pr-3 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-[--light-3] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowIL className="w-4" /> {t("pagination.previous", "Önceki")}
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
                disabled={page === pageNumber}
                className={`py-2 px-4 text-sm border-2 border-solid hover:border-[--border-1] rounded-md disabled:cursor-not-allowed ${
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
          {t("pagination.next", "Sonraki")}
          <ArrowIR className="w-4" />
        </button>
      </div>

      {/* "Go to page" jumper — only shown when there are enough pages to
          warrant skipping. Submit on Enter or by clicking the arrow. */}
      {totalPages > 5 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goTo(jumpValue);
          }}
          className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-[--border-1]"
        >
          <label
            htmlFor="page-jumper"
            className="text-xs font-medium text-[--gr-1] hidden sm:inline"
          >
            {t("pagination.go_to", "Sayfaya git")}:
          </label>
          <input
            id="page-jumper"
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) =>
              setJumpValue(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder={`1-${totalPages}`}
            className="h-9 w-16 px-2 rounded-md border border-[--border-1] bg-[--white-1] text-[--black-1] text-sm text-center tabular-nums outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label={t("pagination.go_to", "Sayfaya git")}
          />
          <button
            type="submit"
            disabled={!jumpValue}
            title={t("pagination.go_to_action", "Git")}
            aria-label={t("pagination.go_to_action", "Git")}
            className="grid place-items-center h-9 px-2.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <CornerDownLeft className="size-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};

export default CustomPagination;
