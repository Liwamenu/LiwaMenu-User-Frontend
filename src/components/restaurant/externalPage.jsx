// External Pages manager. A restaurant can have up to 10 external pages,
// each is either an Image (uploaded file) or an Html block, with a
// customer-facing button name. The 10 cap is shared across both types.
//
// Backend: src/redux/externalPages/ — full CRUD + reorder. Cache lives in
// state.externalPages.get and auto-invalidates when any mutation thunk
// fulfills, so this component never has to manually refetch after a save.

import toast from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import {
  AlertTriangle,
  Code2,
  Expand,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Layout,
  Loader2,
  MousePointerClick,
  Pencil,
  Plus,
  Save,
  Smartphone,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import CustomTextarea from "../common/customTextarea";
import EditImageFile from "../common/editImageFile";
import SettingsTabs from "./settingsTabs";
import { usePopup } from "../../context/PopupContext";
// Shared with announcementSettings.jsx so both authoring surfaces stay
// in lockstep — same Tailwind CDN wrapper, same sandbox/permissions
// contract, same dangerous-content rejection list. If these diverge we
// reintroduce the "preview works in one spot, breaks in the other"
// class of bugs.
import {
  buildPreviewSrcDoc,
  detectDangerousContent,
  PREVIEW_ALLOW,
  PREVIEW_SANDBOX,
} from "../../utils/htmlSafety";
import {
  getExternalPages,
} from "../../redux/externalPages/getExternalPagesSlice";
import {
  createExternalPage,
  resetCreateExternalPage,
} from "../../redux/externalPages/createExternalPageSlice";
import {
  updateExternalPage,
  resetUpdateExternalPage,
} from "../../redux/externalPages/updateExternalPageSlice";
import {
  deleteExternalPage,
  resetDeleteExternalPage,
} from "../../redux/externalPages/deleteExternalPageSlice";
import {
  reorderExternalPages,
  resetReorderExternalPages,
} from "../../redux/externalPages/reorderExternalPagesSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const MAX_PAGES = 10;

const ExternalPage = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();
  const restaurantId = useParams()["*"]?.split("/")[1] || data?.id;

  const { pages, loading, fetchedFor } = useSelector(
    (s) => s.externalPages.get,
  );
  const { success: createSuccess, error: createError } = useSelector(
    (s) => s.externalPages.create,
  );
  const { success: updateSuccess, error: updateError } = useSelector(
    (s) => s.externalPages.update,
  );
  const { success: deleteSuccess, error: deleteError } = useSelector(
    (s) => s.externalPages.delete,
  );
  const { error: reorderError } = useSelector(
    (s) => s.externalPages.reorder,
  );

  // Local mirror of the server list. Used for optimistic drag-and-drop
  // reorder so the cards visually settle the instant the user releases,
  // without waiting for the server round-trip + refetch.
  const [localPages, setLocalPages] = useState([]);

  // Sync local mirror whenever the server list updates.
  useEffect(() => {
    setLocalPages(Array.isArray(pages) ? pages : []);
  }, [pages]);

  // Fetch the list whenever we land on a new restaurant. Cache is
  // invalidated automatically by mutations, so this also picks up post-
  // mutation refreshes.
  useEffect(() => {
    if (!restaurantId) return;
    if (fetchedFor !== restaurantId) {
      dispatch(getExternalPages({ restaurantId }));
    }
  }, [restaurantId, fetchedFor, dispatch]);

  // Toast on each mutation outcome and reset its slice.
  useEffect(() => {
    if (createSuccess) {
      toast.success(t("externalPage.created"), { id: "ext-create" });
      dispatch(resetCreateExternalPage());
      setPopupContent(null);
    }
    if (createError) dispatch(resetCreateExternalPage());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSuccess, createError]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success(t("externalPage.updated"), { id: "ext-update" });
      dispatch(resetUpdateExternalPage());
      setPopupContent(null);
    }
    if (updateError) dispatch(resetUpdateExternalPage());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateSuccess, updateError]);

  useEffect(() => {
    if (deleteSuccess) {
      toast.success(t("externalPage.deleted"), { id: "ext-delete" });
      dispatch(resetDeleteExternalPage());
    }
    if (deleteError) dispatch(resetDeleteExternalPage());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteSuccess, deleteError]);

  useEffect(() => {
    if (reorderError) dispatch(resetReorderExternalPages());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorderError]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    const reordered = Array.from(localPages);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setLocalPages(reordered);
    dispatch(
      reorderExternalPages({
        restaurantId,
        orderedIds: reordered.map((p) => p.id),
      }),
    );
  };

  const openAddPopup = () => {
    if (localPages.length >= MAX_PAGES) {
      toast.error(t("externalPage.quota_full", { max: MAX_PAGES }));
      return;
    }
    setPopupContent(
      <PageEditorPopup mode="add" restaurantId={restaurantId} />,
    );
  };

  const openEditPopup = (page) => {
    setPopupContent(
      <PageEditorPopup mode="edit" page={page} restaurantId={restaurantId} />,
    );
  };

  const openDeleteConfirm = (page) => {
    setPopupContent(<DeleteConfirmPopup page={page} />);
  };

  const remaining = MAX_PAGES - localPages.length;
  const isAtCap = remaining <= 0;

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Layout className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("externalPage.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("externalPage.subtitle", { max: MAX_PAGES })}
            </p>
          </div>
          <span
            className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              isAtCap
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30"
                : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30"
            }`}
          >
            {t("externalPage.count_badge", {
              used: localPages.length,
              max: MAX_PAGES,
            })}
          </span>
          <button
            type="button"
            onClick={openAddPopup}
            disabled={isAtCap}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Plus className="size-3.5" />
            {t("externalPage.add_page")}
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-5">
          {loading && localPages.length === 0 ? (
            <LoadingState t={t} />
          ) : localPages.length === 0 ? (
            <EmptyState t={t} onAdd={openAddPopup} />
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="external-pages">
                {(provided) => (
                  <ul
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-2"
                  >
                    {localPages.map((page, i) => (
                      <Draggable key={page.id} draggableId={page.id} index={i}>
                        {(p, snapshot) => (
                          <li
                            ref={p.innerRef}
                            {...p.draggableProps}
                            className={`rounded-xl border bg-[--white-1] transition ${
                              snapshot.isDragging
                                ? "border-indigo-300 ring-2 ring-indigo-100 shadow-lg"
                                : "border-[--border-1] hover:border-indigo-200"
                            }`}
                          >
                            <PageRow
                              page={page}
                              t={t}
                              dragHandleProps={p.dragHandleProps}
                              onEdit={() => openEditPopup(page)}
                              onDelete={() => openDeleteConfirm(page)}
                            />
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Per-row card. Shows thumbnail / HTML snippet, type pill, button name,
// drag handle, edit + delete actions.

const PageRow = ({ page, t, dragHandleProps, onEdit, onDelete }) => {
  const isImage = page.type === "Image";

  return (
    <div className="p-3 flex items-center gap-3">
      <button
        type="button"
        {...dragHandleProps}
        aria-label={t("externalPage.drag")}
        className="grid place-items-center size-8 rounded-md text-[--gr-2] hover:text-indigo-600 hover:bg-[--white-2] transition cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Preview thumbnail */}
      <div className="size-14 shrink-0 rounded-lg overflow-hidden bg-[--white-2] border border-[--border-1] grid place-items-center">
        {isImage && page.imageURL ? (
          <img
            src={page.imageURL}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : isImage ? (
          <ImageIcon className="size-5 text-[--gr-2]" />
        ) : (
          <Code2 className="size-5 text-[--gr-2]" />
        )}
      </div>

      {/* Meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              isImage
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30"
                : "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/30"
            }`}
          >
            {isImage ? (
              <ImageIcon className="size-2.5" />
            ) : (
              <Code2 className="size-2.5" />
            )}
            {isImage
              ? t("externalPage.type_image")
              : t("externalPage.type_html")}
          </span>
        </div>
        <p className="text-sm font-semibold text-[--black-1] truncate flex items-center gap-1.5">
          <MousePointerClick className="size-3.5 text-indigo-600 shrink-0" />
          {page.buttonName || (
            <span className="italic text-[--gr-1]">
              {t("externalPage.no_button_name")}
            </span>
          )}
        </p>
        {!isImage && page.htmlBody && (
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5 font-mono">
            {page.htmlBody.replace(/<[^>]+>/g, " ").slice(0, 80)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          title={t("externalPage.edit")}
          className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title={t("externalPage.delete")}
          className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Add / Edit popup. Type is immutable after creation (per API spec —
// delete and re-create if you want to switch).

const PageEditorPopup = ({ mode, page, restaurantId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent, setCropImgPopup } = usePopup();

  const { loading: createLoading } = useSelector(
    (s) => s.externalPages.create,
  );
  const { loading: updateLoading } = useSelector(
    (s) => s.externalPages.update,
  );
  const saving = createLoading || updateLoading;

  // Initial state from `page` on edit; sensible defaults on add.
  const [type, setType] = useState(page?.type ?? "Image");
  const [buttonName, setButtonName] = useState(page?.buttonName ?? "");
  const [htmlBody, setHtmlBody] = useState(page?.htmlBody ?? "");
  const [imageFile, setImageFile] = useState(null); // new upload
  const [imagePreview, setImagePreview] = useState(page?.imageURL ?? "");

  // ObjectURL lifecycle for the new-file preview.
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("externalPage.invalid_image"));
      return;
    }
    const maxMb = import.meta.env.VITE_MAX_FILE_SIZE_MB || 5;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(t("externalPage.image_too_large", { mb: maxMb }));
      return;
    }
    setCropImgPopup(
      <EditImageFile
        file={file}
        onSave={(cropped) => setImageFile(cropped)}
      />,
    );
  };

  const openFullPreview = () => {
    if (!imagePreview) return;
    setPopupContent(<ImageFullPreviewPopup src={imagePreview} t={t} />);
  };

  const validate = () => {
    if (!buttonName.trim()) {
      toast.error(t("externalPage.button_name_required"));
      return false;
    }
    if (type === "Image") {
      if (mode === "add" && !imageFile) {
        toast.error(t("externalPage.image_required"));
        return false;
      }
    } else if (type === "Html") {
      if (!htmlBody.trim()) {
        toast.error(t("externalPage.html_required"));
        return false;
      }
      // Block save if the HTML contains XSS- or SQL-injection-shaped
      // patterns. Surface the offending tokens in the toast so the
      // author can fix them without guessing. Same contract as the
      // announcement-settings save path.
      const dangerous = detectDangerousContent(htmlBody);
      if (dangerous.length > 0) {
        toast.error(
          t("externalPage.dangerous_content_blocked", {
            items: dangerous.join(", "),
          }),
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (saving) return;
    if (!validate()) return;
    if (mode === "add") {
      const fd = new FormData();
      fd.append("restaurantId", restaurantId);
      fd.append("type", type);
      fd.append("buttonName", buttonName.trim());
      if (type === "Image") {
        fd.append("image", imageFile);
      } else {
        fd.append("htmlBody", htmlBody);
      }
      dispatch(createExternalPage(fd));
    } else {
      // Edit — only send fields that changed. Type is immutable.
      const fd = new FormData();
      if (buttonName.trim() !== (page.buttonName ?? "")) {
        fd.append("buttonName", buttonName.trim());
      }
      if (type === "Image" && imageFile) {
        fd.append("image", imageFile);
      }
      if (type === "Html" && htmlBody !== (page.htmlBody ?? "")) {
        fd.append("htmlBody", htmlBody);
      }
      // If nothing changed, just close.
      if ([...fd.keys()].length === 0) {
        setPopupContent(null);
        return;
      }
      dispatch(updateExternalPage({ id: page.id, body: fd }));
    }
  };

  const labelCls =
    "block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide uppercase";

  return (
    <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-[1104px] mx-auto shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col max-h-[92dvh]">
      {/* Width: 1104px = the original max-w-3xl (768px) bumped ~44% in
          two passes (768 → 920 → 1104). The 2x2 grid (Button Name +
          HTML editor on the left, phone-frame preview on the right)
          needed the extra room — the HTML textarea was wrapping
          markup awkwardly at 920px even with the preview docked
          alongside instead of below. mx-auto + max-h:92dvh keep the
          modal centred and scrollable on smaller screens. */}
      <div className="h-0.5 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      {/* HEADER */}
      <header className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Layout className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
            {mode === "add"
              ? t("externalPage.add_title")
              : t("externalPage.edit_title")}
          </h2>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
            {mode === "add"
              ? t("externalPage.add_subtitle")
              : t("externalPage.edit_subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          aria-label={t("externalPage.close")}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* BODY */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* TYPE PICKER (add only — immutable after create) */}
        <div>
          <label className={labelCls}>{t("externalPage.type_label")}</label>
          <div className="inline-flex items-center p-1 rounded-xl border border-[--border-1] bg-[--white-2]/40 gap-1">
            <TypeButton
              active={type === "Image"}
              disabled={mode === "edit"}
              onClick={() => setType("Image")}
              icon={ImageIcon}
              label={t("externalPage.type_image")}
            />
            <TypeButton
              active={type === "Html"}
              disabled={mode === "edit"}
              onClick={() => setType("Html")}
              icon={Code2}
              label={t("externalPage.type_html")}
            />
          </div>
          {mode === "edit" && (
            <p className="mt-1 text-[11px] text-[--gr-1]">
              {t("externalPage.type_locked_hint")}
            </p>
          )}
        </div>

        {/* BUTTON NAME + TYPE-SPECIFIC EDITOR
            ----------------------------------
            For HTML pages we use a 2x2 grid so the live preview
            spans both rows on the right while Button Name (top-left)
            and the HTML textarea (bottom-left) stack underneath each
            other on the left. This:
              • narrows the Button Name input from full-width to ~58%
                of the modal — it never needed full width anyway, the
                placeholder example "Hakkımızda, Şarap Menüsü" is
                short, and
              • lets the preview start at the same vertical position
                as Button Name, so it gets ~50% more vertical real
                estate without growing the modal.
            For Image pages we keep the original single-column flow:
            the image picker is wide and self-contained, no preview
            pane to dock alongside it. */}
        {type === "Html" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] lg:grid-rows-[auto,1fr] gap-3">
            <div className="lg:col-start-1 lg:row-start-1">
              <ButtonNameField
                t={t}
                value={buttonName}
                onChange={setButtonName}
                labelCls={labelCls}
              />
            </div>
            <div className="lg:col-start-1 lg:row-start-2 min-h-0">
              <HtmlEditorPane
                t={t}
                value={htmlBody}
                onChange={setHtmlBody}
              />
            </div>
            <div className="lg:col-start-2 lg:row-start-1 lg:row-end-3 min-h-0">
              <HtmlPreviewPane t={t} value={htmlBody} />
            </div>
          </div>
        ) : (
          <>
            <ButtonNameField
              t={t}
              value={buttonName}
              onChange={setButtonName}
              labelCls={labelCls}
            />
            <ImageEditor
              t={t}
              preview={imagePreview}
              onPick={handlePickImage}
              onClear={() => {
                setImageFile(null);
                setImagePreview("");
              }}
              onFullPreview={openFullPreview}
            />
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="px-4 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
        >
          {t("externalPage.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-wait"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mode === "add"
            ? t("externalPage.create")
            : t("externalPage.save")}
        </button>
      </footer>
    </div>
  );
};

const TypeButton = ({ active, disabled, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition ${
      active
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
        : "text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-1]"
    } disabled:opacity-60 disabled:cursor-not-allowed`}
  >
    <Icon className="size-3.5" />
    {label}
  </button>
);

const ImageEditor = ({ t, preview, onPick, onClear, onFullPreview }) => (
  <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/40 p-4 flex flex-col sm:flex-row items-start gap-4">
    <div className="size-32 shrink-0 rounded-lg overflow-hidden bg-[--white-1] border border-[--border-1] grid place-items-center">
      {preview ? (
        <img src={preview} alt="" className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="size-8 text-[--gr-2]" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-[--gr-1] mb-2">
        {t("externalPage.image_hint")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-xs font-semibold text-[--black-2] hover:border-indigo-300 hover:text-indigo-700 cursor-pointer transition">
          <Upload className="size-3.5" />
          {preview
            ? t("externalPage.change_image")
            : t("externalPage.pick_image")}
          <input
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            onChange={onPick}
            className="hidden"
          />
        </label>
        {preview && (
          <>
            <button
              type="button"
              onClick={onFullPreview}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <Expand className="size-3.5" />
              {t("externalPage.full_preview")}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition"
            >
              <Trash2 className="size-3.5" />
              {t("externalPage.remove_image")}
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

// Small reusable button-name input, lifted out of the modal body so
// it can live either in the HTML page's 2-col grid (top-left cell)
// or alone in the Image page's vertical stack. Width is governed by
// whichever container it's dropped into — `w-full` here, the parent
// grid column controls the actual rendered size.
const ButtonNameField = ({ t, value, onChange, labelCls }) => (
  <div>
    <label className={labelCls}>
      <span className="inline-flex items-center gap-1.5">
        <MousePointerClick className="size-3.5 text-indigo-600" />
        {t("externalPage.button_name_label")}
      </span>
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t("externalPage.button_name_placeholder")}
      maxLength={100}
      className="w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] placeholder:text-[--gr-2] outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
    />
    <p className="mt-1 text-[11px] text-[--gr-1]">
      {t("externalPage.button_name_hint")}
    </p>
  </div>
);

// HTML textarea pane — used to be the left half of the monolithic
// `HtmlEditor`. Lifted out so the parent can place it next to a
// preview pane that spans more vertical real estate (Button Name +
// HTML editor stacked left, Preview spanning both rows right).
const HtmlEditorPane = ({ t, value, onChange }) => (
  <div className="rounded-xl border border-[--border-1] overflow-hidden bg-slate-900 flex flex-col h-full min-h-[16rem] shadow-sm">
    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/60 bg-slate-800/60 text-slate-200 text-[11px] font-bold uppercase tracking-[0.12em]">
      <Code2 className="size-3.5 text-cyan-400" />
      {t("externalPage.html_label")}
    </div>
    <CustomTextarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={20}
      className2="!flex-1 !min-h-0"
      className="!w-full !flex-1 !p-4 !font-mono !text-xs !bg-slate-900 !text-slate-200 !border-0 !rounded-none focus:!ring-0 !outline-none !resize-none !shadow-none !min-h-[16rem]"
      placeholder={t("externalPage.html_placeholder")}
    />
  </div>
);

// Live preview pane — sandboxed iframe in a fixed-width device frame.
// Same contract as Announcement Settings + the customer renderer:
// PREVIEW_SANDBOX + PREVIEW_ALLOW are shared so admin and customer
// agree on what scripts / popups / embedded media are permitted.
// Lifted out of `HtmlEditor` so the parent can let it span both rows
// of a 2x2 grid — it now sits at the same vertical position as the
// Button Name input AND extends down past the HTML textarea, giving
// the iframe ~50% more vertical room without growing the modal.
//
// Sizing chain — fragile, easy to break, so spelled out explicitly:
//   1. Outer wrapper has an explicit `min-h-[70dvh]` so even when the
//      grid row's intrinsic height collapses (no parent flex chain
//      with a real height to distribute), the pane still claims a
//      meaningful vertical area for the iframe to fill. Using `dvh`
//      not `vh` so it follows the visible viewport on mobile when the
//      browser chrome animates in/out.
//   2. Outer wrapper is `flex flex-col` and the body div uses
//      `flex-1 min-h-0` so it grabs the leftover height inside the
//      pane (header subtracted automatically).
//   3. Body switches from `grid place-items-start` to
//      `flex flex-col items-center` — the previous grid alignment
//      kept the phone frame at its min-height instead of stretching.
//   4. Phone frame uses `flex-1 min-h-0` to fill the body's height,
//      not `minHeight: 28rem` (which left the iframe's `h-full` with
//      no defined height to be 100% of, collapsing it to content).
//   5. Iframe inside the phone frame uses `flex-1` so it fills the
//      frame's full height instead of guessing.
const HtmlPreviewPane = ({ t, value }) => {
  const previewSrcDoc = useMemo(() => buildPreviewSrcDoc(value), [value]);

  return (
    <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 flex flex-col min-h-[70dvh] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[--border-1] bg-[--white-1]/70 shrink-0">
        <div className="flex items-center gap-2 text-[--gr-1] text-[11px] font-bold uppercase tracking-[0.12em] min-w-0">
          <Eye className="size-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{t("externalPage.live_preview")}</span>
        </div>
        {/* Static "Mobil" badge — see commit history for why the
            Mobil/Masaüstü toggle was removed. */}
        <span
          className="inline-flex items-center gap-1 px-2 h-6 rounded-md bg-indigo-600 text-white text-[10px] font-semibold uppercase tracking-wider shadow-sm shrink-0"
          aria-label={t("externalPage.preview_mobile")}
        >
          <Smartphone className="size-3" />
          <span className="hidden sm:inline">
            {t("externalPage.preview_mobile")}
          </span>
        </span>
      </div>
      <div className="flex-1 min-h-0 p-3 flex flex-col items-center">
        {value ? (
          <div
            // Fixed mobile width on the horizontal axis; vertical axis
            // stretches to fill the body via flex-1.
            className="bg-white rounded-2xl shadow-lg border border-[--border-1] overflow-hidden w-full max-w-[360px] flex flex-col flex-1 min-h-0"
          >
            <iframe
              title={t("externalPage.live_preview")}
              className="w-full flex-1 min-h-0 border-0 bg-white block"
              sandbox={PREVIEW_SANDBOX}
              allow={PREVIEW_ALLOW}
              srcDoc={previewSrcDoc}
            />
          </div>
        ) : (
          <p className="text-xs text-[--gr-1] italic text-center mt-10 px-4">
            {t("externalPage.preview_empty")}
          </p>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Delete confirmation popup. Inline so the parent component can keep its
// state. Wired through PopupContext (single popup mount).

const DeleteConfirmPopup = ({ page }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();
  const { loading } = useSelector((s) => s.externalPages.delete);

  // Close popup automatically when the delete succeeds (parent's effect
  // handles the toast + cache reset).
  const prevLoadingRef = useRef(loading);
  const { success } = useSelector((s) => s.externalPages.delete);
  useEffect(() => {
    if (prevLoadingRef.current && !loading && success) {
      setPopupContent(null);
    }
    prevLoadingRef.current = loading;
  }, [loading, success, setPopupContent]);

  return (
    <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-md mx-auto shadow-2xl ring-1 ring-[--border-1] overflow-hidden">
      <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />
      <header className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
        <span className="grid place-items-center size-9 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30 shrink-0">
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
            {t("externalPage.delete_title")}
          </h2>
        </div>
      </header>
      <div className="p-4 sm:p-5">
        <p className="text-sm text-[--black-2]">
          {t("externalPage.delete_confirm", {
            name: page.buttonName || t("externalPage.this_page"),
          })}
        </p>
        <p className="text-[11px] text-[--gr-1] mt-2">
          {t("externalPage.delete_irreversible")}
        </p>
      </div>
      <footer className="px-4 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
        >
          {t("externalPage.cancel")}
        </button>
        <button
          type="button"
          onClick={() => dispatch(deleteExternalPage({ id: page.id }))}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {t("externalPage.delete")}
        </button>
      </footer>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Full-size image preview. Used both from the editor and from each row
// (future enhancement — currently only the editor uses it).

const ImageFullPreviewPopup = ({ src, t }) => {
  const { setPopupContent } = usePopup();
  return (
    <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-5xl mx-auto shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col max-h-[92dvh]">
      <div className="h-0.5 shrink-0" style={{ background: PRIMARY_GRADIENT }} />
      <header className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <ImageIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
            {t("externalPage.full_preview_title")}
          </h2>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
            {t("externalPage.full_preview_subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          aria-label={t("externalPage.close")}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="flex-1 min-h-0 overflow-auto bg-[--white-2]/40 grid place-items-start justify-items-center p-4">
        <img
          src={src}
          alt=""
          className="max-w-full h-auto rounded-lg shadow-md ring-1 ring-[--border-1]"
        />
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────

const LoadingState = ({ t }) => (
  <div className="grid place-items-center py-12 text-[--gr-1]">
    <Loader2 className="size-6 animate-spin mb-2" />
    <p className="text-xs">{t("externalPage.loading")}</p>
  </div>
);

const EmptyState = ({ t, onAdd }) => (
  <div className="grid place-items-center py-12 text-center px-4">
    <span className="grid place-items-center size-14 rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 mb-3 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
      <Layout className="size-7" />
    </span>
    <p className="text-sm font-bold text-[--black-1] mb-1">
      {t("externalPage.empty_title")}
    </p>
    <p className="text-xs text-[--gr-1] max-w-sm mb-4">
      {t("externalPage.empty_subtitle")}
    </p>
    <button
      type="button"
      onClick={onAdd}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
      style={{ background: PRIMARY_GRADIENT }}
    >
      <Plus className="size-4" />
      {t("externalPage.add_first")}
    </button>
  </div>
);

export default ExternalPage;
