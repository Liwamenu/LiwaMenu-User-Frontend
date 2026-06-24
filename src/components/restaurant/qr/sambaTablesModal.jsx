// SambaPOS table picker — opened from the QR Code page hero. Loads the
// restaurant's table list from the backend, lets the user uncheck any
// tables they don't want a QR for, then hands the remaining names back
// to the parent so it can run them through the existing QR generator.
//
// The list is sorted alphabetically (Turkish-aware) and filterable.
// Nothing is selected by default — the user explicitly checks the tables
// they want. "Select all" only affects the rows currently matching the
// search filter. Re-opening the modal resets the selection so the flow
// is repeatable.

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  X,
  Loader2,
  Search,
  RefreshCcw,
  AlertTriangle,
  ServerCrash,
  CheckSquare,
  Square,
  QrCode,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getSambaTables,
  resetGetSambaTablesState,
} from "../../../redux/sambaTables/getSambaTablesSlice";
import {
  deleteSambaTables,
  resetDeleteSambaTablesState,
} from "../../../redux/sambaTables/deleteSambaTablesSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Diacritic-insensitive Turkish lower-case for sort + search. Mirrors
// the helper used elsewhere in the app so the user gets consistent
// behaviour ("ı" === "i", "ş" === "s", etc.).
const trFold = (s) => String(s ?? "").toLocaleLowerCase("tr-TR");

const SambaTablesModal = ({ restaurantId, onClose, onGenerate }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, success, error, tables } = useSelector(
    (s) => s.sambaTables.get,
  );
  const { loading: deleting } = useSelector((s) => s.sambaTables.del);

  // `selected` is the user's positive selection — Set of names they
  // checked. Default behaviour: nothing selected (empty Set) so the user
  // must explicitly pick the tables they want.
  const [selected, setSelected] = useState(() => new Set());
  const [searchVal, setSearchVal] = useState("");
  // Two-step guard for the destructive "delete selected" action.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fire the fetch on mount + whenever the parent reopens us with a
  // different restaurant. Reset state on unmount so the next open
  // starts from a clean slate.
  useEffect(() => {
    if (restaurantId) {
      dispatch(getSambaTables({ restaurantId }));
    }
    return () => {
      dispatch(resetGetSambaTablesState());
      dispatch(resetDeleteSambaTablesState());
    };
  }, [restaurantId, dispatch]);

  const sortedTables = useMemo(() => {
    if (!Array.isArray(tables)) return [];
    // Natural / numeric-aware sort: with `numeric: true`, embedded
    // numbers compare as numbers ("Bahçe-2" < "Bahçe-10") instead of
    // as strings ("Bahçe-10" < "Bahçe-2" because '1' < '2'). This
    // order also flows through to QR generation since the modal hands
    // `remaining` straight to onGenerate without re-sorting.
    return [...tables].sort((a, b) =>
      trFold(a).localeCompare(trFold(b), "tr", { numeric: true }),
    );
  }, [tables]);

  const visibleTables = useMemo(() => {
    const q = trFold(searchVal.trim());
    if (!q) return sortedTables;
    return sortedTables.filter((name) => trFold(name).includes(q));
  }, [sortedTables, searchVal]);

  const remaining = useMemo(
    () => sortedTables.filter((n) => selected.has(n)),
    [sortedTables, selected],
  );

  const toggleOne = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const allVisibleSelected =
    visibleTables.length > 0 &&
    visibleTables.every((n) => selected.has(n));

  // "Select all" / "Deselect all" — scoped to the rows currently matching
  // the search filter, so searching then selecting all picks only the
  // filtered subset, never the whole list.
  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        // Every visible row is already selected → unselect just those.
        visibleTables.forEach((n) => next.delete(n));
      } else {
        // Some visible rows are unselected → select all the visible ones.
        visibleTables.forEach((n) => next.add(n));
      }
      return next;
    });
  };

  const handleRefresh = () => {
    if (restaurantId) dispatch(getSambaTables({ restaurantId }));
  };

  const handleConfirm = () => {
    if (!remaining.length) return;
    onGenerate(remaining);
    onClose();
  };

  // Delete the currently-selected (checked) tables. Two-step: the toolbar
  // button arms `confirmingDelete`, then the banner's confirm fires this.
  const confirmDelete = async () => {
    if (!remaining.length || deleting) return;
    setDeleteError(null);
    try {
      const res = await dispatch(
        deleteSambaTables({ restaurantId, names: remaining }),
      ).unwrap();
      // Backend ResponsBase: { data: { deletedCount, syncWarning? }, ... }
      const deletedCount = res?.data?.deletedCount ?? remaining.length;
      toast.success(
        t("sambaTables.delete_success", { count: deletedCount }),
      );
      // SambaPOS-sourced tables can be re-created on the next sync; the
      // backend flags this with `syncWarning`. Surface it so the user
      // isn't surprised when a deleted table reappears later.
      if (res?.data?.syncWarning) {
        toast(t("sambaTables.delete_sync_warning"), {
          icon: "⚠️",
          id: "samba-delete-sync-warning",
          duration: 6500,
        });
      }
      setSelected(new Set());
      setConfirmingDelete(false);
      dispatch(getSambaTables({ restaurantId })); // refresh the list
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      // Show the failure INLINE in the confirm dialog (not just a toast) so
      // it's never silent — keeps the dialog open with a clear reason.
      setDeleteError(
        status === 404 || status === 0
          ? t("sambaTables.delete_not_ready")
          : err?.message_TR || t("sambaTables.delete_failed"),
      );
    }
  };

  return (
    <div className="relative bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-2xl mx-auto shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col max-h-[90dvh]">
      {/* Gradient accent strip */}
      <div className="h-0.5 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      {/* HEADER */}
      <header className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <QrCode className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
            {t("sambaTables.title")}
          </h2>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
            {Array.isArray(tables)
              ? t("sambaTables.summary", {
                  selected: remaining.length,
                  total: sortedTables.length,
                })
              : t("sambaTables.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          aria-label={t("sambaTables.refresh")}
          title={t("sambaTables.refresh")}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-indigo-600 hover:bg-[--white-2] transition disabled:opacity-50 shrink-0"
        >
          <RefreshCcw
            className={`size-4 ${loading ? "animate-spin" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("sambaTables.close")}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* TOOLBAR — search + select-all */}
      {Array.isArray(tables) && tables.length > 0 && (
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-2 shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--gr-2] pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={t("sambaTables.search_placeholder")}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <button
            type="button"
            onClick={toggleAllVisible}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-xs font-semibold hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition shrink-0"
          >
            {allVisibleSelected ? (
              <>
                <Square className="size-3.5" />
                {t("sambaTables.deselect_all")}
              </>
            ) : (
              <>
                <CheckSquare className="size-3.5" />
                {t("sambaTables.select_all")}
              </>
            )}
          </button>
          {/* Delete the selected (checked) tables — destructive, guarded
              by the confirm banner below. */}
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
            disabled={!remaining.length || deleting || confirmingDelete}
            title={t("sambaTables.delete_selected")}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 hover:border-rose-300 transition shrink-0 disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">
              {t("sambaTables.delete_selected")}
            </span>
          </button>
        </div>
      )}

      {/* BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
        {loading && !tables && <LoadingState t={t} />}
        {error && !loading && <ErrorState t={t} onRetry={handleRefresh} />}
        {!loading && !error && Array.isArray(tables) && tables.length === 0 && (
          <EmptyState t={t} />
        )}
        {Array.isArray(tables) && tables.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {visibleTables.length === 0 && (
              <li className="text-center text-xs text-[--gr-1] italic py-6">
                {t("sambaTables.no_results")}
              </li>
            )}
            {visibleTables.map((name) => {
              const isSelected = selected.has(name);
              return (
                <li key={name}>
                  <label
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50/70 shadow-sm dark:bg-indigo-500/10 dark:border-indigo-400/40"
                        : "border-[--border-1] bg-[--white-1] hover:border-indigo-300 hover:bg-[--white-2]/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(name)}
                      className="size-4 rounded border-[--border-1] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span
                      className={`flex-1 min-w-0 text-sm truncate ${
                        isSelected
                          ? "text-[--black-1] font-semibold"
                          : "text-[--black-2] font-medium"
                      }`}
                    >
                      {name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* FOOTER */}
      <footer className="px-4 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-between gap-3 shrink-0">
        <span className="text-[11px] font-semibold text-[--gr-1] uppercase tracking-wide truncate">
          {Array.isArray(tables) && tables.length > 0
            ? t("sambaTables.summary", {
                selected: remaining.length,
                total: sortedTables.length,
              })
            : ""}
        </span>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
          >
            {t("sambaTables.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!remaining.length}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <QrCode className="size-4" />
            {t("sambaTables.generate", { count: remaining.length })}
          </button>
        </div>
      </footer>

      {/* Destructive confirm — centered overlay so it can't be missed.
          Failures show inline (deleteError) instead of a silent no-op. */}
      {confirmingDelete && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[--white-1] border border-[--border-1] shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center size-10 rounded-xl bg-rose-100 text-rose-600 shrink-0 dark:bg-rose-500/15 dark:text-rose-300">
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[--black-1]">
                  {t("sambaTables.delete_confirm_title", {
                    count: remaining.length,
                  })}
                </h3>
                <p className="text-xs text-[--gr-1] mt-1">
                  {t("sambaTables.delete_confirm_desc")}
                </p>
                {deleteError && (
                  <p className="mt-2.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-2 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/30">
                    {deleteError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="h-9 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition disabled:opacity-50"
              >
                {t("sambaTables.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {t("sambaTables.delete_confirm_yes", {
                  count: remaining.length,
                })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingState = ({ t }) => (
  <div className="grid place-items-center py-10 text-[--gr-1]">
    <Loader2 className="size-5 animate-spin mb-2" />
    <p className="text-xs">{t("sambaTables.loading")}</p>
  </div>
);

const EmptyState = ({ t }) => (
  <div className="grid place-items-center py-10 text-center px-4">
    <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-500/15 dark:text-indigo-200">
      <AlertTriangle className="size-6" />
    </span>
    <p className="text-sm font-semibold text-[--black-1]">
      {t("sambaTables.empty_title")}
    </p>
    <p className="text-xs text-[--gr-1] mt-1 max-w-xs">
      {t("sambaTables.empty_desc")}
    </p>
  </div>
);

const ErrorState = ({ t, onRetry }) => (
  <div className="grid place-items-center py-10 text-center px-4">
    <span className="grid place-items-center size-12 rounded-xl bg-rose-50 text-rose-600 mb-3 dark:bg-rose-500/15 dark:text-rose-200">
      <ServerCrash className="size-6" />
    </span>
    <p className="text-sm font-semibold text-[--black-1]">
      {t("sambaTables.error_title")}
    </p>
    <p className="text-xs text-[--gr-1] mt-1 max-w-xs">
      {t("sambaTables.error_desc")}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-xs font-semibold hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
    >
      <RefreshCcw className="size-3.5" />
      {t("sambaTables.retry")}
    </button>
  </div>
);

export default SambaTablesModal;
