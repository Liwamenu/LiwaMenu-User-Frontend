// Payment Gateway settings page.
//
// One row per restaurant on the backend (`/api/PaymentGateways/...`), but
// we surface it as THREE form cards (PayTR / Stripe / Iyzico) because
// each provider has its own credential set and toggles. The owner can
// save / delete each independently — Upsert is per-card, Delete is
// per-card. The whole row is gated by the Payment Integration license
// (the subSidebar only shows the entry when active; this page also
// short-circuits with a "license missing" empty-state for direct URL
// visits).

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ShieldCheck,
  ShieldX,
  Trash2,
} from "lucide-react";

import PageHelp from "../common/pageHelp";
import { getPaymentGateways } from "../../redux/paymentGateways/getPaymentGatewaysSlice";
import {
  upsertPaymentGateway,
  resetUpsertPaymentGateway,
} from "../../redux/paymentGateways/upsertPaymentGatewaySlice";
import {
  deletePaymentGateway,
  resetDeletePaymentGateway,
} from "../../redux/paymentGateways/deletePaymentGatewaySlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Gateway-type ids (mirror the backend enum):
//   0 = PayTR · 1 = Stripe · 2 = Iyzico
const GATEWAYS = [
  {
    key: "paytr",
    gatewayType: 0,
    titleKey: "paymentGateways.paytr_title",
    subtitleKey: "paymentGateways.paytr_subtitle",
    fields: [
      { name: "payTrMerchantId", labelKey: "paymentGateways.paytr_merchant_id" },
      {
        name: "payTrMerchantKey",
        labelKey: "paymentGateways.paytr_merchant_key",
        secret: true,
      },
      {
        name: "payTrMerchantSalt",
        labelKey: "paymentGateways.paytr_merchant_salt",
        secret: true,
      },
    ],
    booleanField: {
      name: "payTrTestMode",
      labelKey: "paymentGateways.paytr_test_mode",
    },
  },
  {
    key: "stripe",
    gatewayType: 1,
    titleKey: "paymentGateways.stripe_title",
    subtitleKey: "paymentGateways.stripe_subtitle",
    fields: [
      {
        name: "stripePublishableKey",
        labelKey: "paymentGateways.stripe_publishable_key",
      },
      {
        name: "stripeSecretKey",
        labelKey: "paymentGateways.stripe_secret_key",
        secret: true,
      },
      {
        name: "stripeWebhookSecret",
        labelKey: "paymentGateways.stripe_webhook_secret",
        secret: true,
      },
    ],
  },
  {
    key: "iyzico",
    gatewayType: 2,
    titleKey: "paymentGateways.iyzico_title",
    subtitleKey: "paymentGateways.iyzico_subtitle",
    fields: [
      { name: "iyzicoApiKey", labelKey: "paymentGateways.iyzico_api_key" },
      {
        name: "iyzicoSecretKey",
        labelKey: "paymentGateways.iyzico_secret_key",
        secret: true,
      },
      {
        name: "iyzicoBaseUrl",
        labelKey: "paymentGateways.iyzico_base_url",
        placeholder: "https://api.iyzipay.com",
      },
    ],
  },
];

// Field allowlist per provider — used when building the Upsert body so
// we never leak fields belonging to a different provider into the row.
const FIELDS_BY_TYPE = GATEWAYS.reduce((acc, g) => {
  acc[g.gatewayType] = [
    ...g.fields.map((f) => f.name),
    ...(g.booleanField ? [g.booleanField.name] : []),
  ];
  return acc;
}, {});

const PaymentGatewaySettings = ({ data: restaurant }) => {
  const params = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const restaurantId = params.id;

  const { data: gatewayRow, loading: getLoading } = useSelector(
    (s) => s.paymentGateways.get,
  );
  const { loading: saveLoading, success: saveSuccess, error: saveError } =
    useSelector((s) => s.paymentGateways.upsert);
  const {
    loading: deleteLoading,
    success: deleteSuccess,
    error: deleteError,
  } = useSelector((s) => s.paymentGateways.delete);

  // Local mutable per-card state seeded from the backend row.
  const [forms, setForms] = useState(() => seedForms(null));
  const [pendingKey, setPendingKey] = useState(null); // which card initiated the save

  useEffect(() => {
    if (!restaurantId) return;
    dispatch(getPaymentGateways({ restaurantId }));
  }, [restaurantId, dispatch]);

  // Re-seed local forms whenever the backend row arrives.
  useEffect(() => {
    setForms(seedForms(gatewayRow));
  }, [gatewayRow]);

  // Save / delete toasts.
  useEffect(() => {
    if (saveSuccess) {
      toast.success(t("paymentGateways.save_success"), {
        id: "pg-save-success",
      });
      dispatch(resetUpsertPaymentGateway());
      dispatch(getPaymentGateways({ restaurantId, __silent: true }));
      setPendingKey(null);
    }
    if (saveError) {
      toast.error(
        saveError?.message_TR || saveError?.message || t("paymentGateways.save_error"),
        { id: "pg-save-error" },
      );
      dispatch(resetUpsertPaymentGateway());
      setPendingKey(null);
    }
  }, [saveSuccess, saveError, dispatch, restaurantId, t]);

  useEffect(() => {
    if (deleteSuccess) {
      toast.success(t("paymentGateways.delete_success"), {
        id: "pg-delete-success",
      });
      dispatch(resetDeletePaymentGateway());
      dispatch(getPaymentGateways({ restaurantId, __silent: true }));
      setPendingKey(null);
    }
    if (deleteError) {
      toast.error(
        deleteError?.message_TR ||
          deleteError?.message ||
          t("paymentGateways.delete_error"),
        { id: "pg-delete-error" },
      );
      dispatch(resetDeletePaymentGateway());
      setPendingKey(null);
    }
  }, [deleteSuccess, deleteError, dispatch, restaurantId, t]);

  // License gate. The subSidebar already hides the entry; this is the
  // belt-and-suspenders for direct URL visits. We require the
  // restaurant prop to be resolved (no flash of "license required"
  // while it's still loading) — only then check the flag.
  if (!restaurant) {
    return (
      <div className="w-full pb-8 mt-1 grid place-items-center min-h-[20rem]">
        <Loader2 className="size-6 animate-spin text-[--primary-1]" />
      </div>
    );
  }
  if (!restaurant.paymentIntegrationLicenseIsActive) {
    return (
      <div className="w-full pb-8 mt-1">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center">
          <span className="mx-auto grid place-items-center size-12 rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <AlertTriangle className="size-5" />
          </span>
          <h3 className="mt-3 text-base font-bold text-amber-900">
            {t("paymentGateways.license_required_title")}
          </h3>
          <p className="mt-1 text-sm text-amber-900/90">
            {t("paymentGateways.license_required_hint")}
          </p>
        </div>
      </div>
    );
  }

  const onChangeField = (provKey, fieldName, value) => {
    setForms((prev) => ({
      ...prev,
      [provKey]: { ...prev[provKey], [fieldName]: value },
    }));
  };

  const onToggleActive = (provKey) => {
    setForms((prev) => ({
      ...prev,
      [provKey]: { ...prev[provKey], isActive: !prev[provKey].isActive },
    }));
  };

  const onToggleBoolean = (provKey, fieldName) => {
    setForms((prev) => ({
      ...prev,
      [provKey]: { ...prev[provKey], [fieldName]: !prev[provKey][fieldName] },
    }));
  };

  const onSave = (gw) => {
    if (saveLoading) return;
    const f = forms[gw.key];
    // Build a minimal body: restaurantId, gatewayType, isActive, plus
    // only the fields this provider owns. Strings are sent verbatim
    // (no trim) so trailing whitespace in keys is the caller's problem,
    // not ours — corrupting a Stripe secret because we trimmed would be
    // worse than letting them see exactly what they pasted.
    const body = {
      restaurantId,
      gatewayType: gw.gatewayType,
      isActive: !!f.isActive,
    };
    for (const name of FIELDS_BY_TYPE[gw.gatewayType]) {
      body[name] = f[name] ?? null;
    }
    setPendingKey(gw.key);
    dispatch(upsertPaymentGateway(body));
  };

  const onDelete = (gw) => {
    if (deleteLoading) return;
    const id = gatewayRow?.id;
    if (!id) {
      // Nothing to delete server-side — just reset the local card.
      setForms((prev) => ({
        ...prev,
        [gw.key]: emptyFormFor(gw),
      }));
      return;
    }
    const ok = window.confirm(t("paymentGateways.delete_confirm"));
    if (!ok) return;
    setPendingKey(gw.key);
    dispatch(deletePaymentGateway({ id, restaurantId }));
  };

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* Hero header */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <CreditCard className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold truncate tracking-tight">
              {t("paymentGateways.title", { name: restaurant?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("paymentGateways.subtitle")}
            </p>
          </div>
          <PageHelp pageKey="paymentGateways" />
          {getLoading ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200">
              <Loader2 className="size-3.5 animate-spin" />
              {t("paymentGateways.loading")}
            </span>
          ) : null}
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {GATEWAYS.map((gw) => (
            <ProviderCard
              key={gw.key}
              gw={gw}
              form={forms[gw.key]}
              isCurrentRow={gatewayRow?.gatewayType === gw.gatewayType}
              onChangeField={(name, val) => onChangeField(gw.key, name, val)}
              onToggleActive={() => onToggleActive(gw.key)}
              onToggleBoolean={(name) => onToggleBoolean(gw.key, name)}
              onSave={() => onSave(gw)}
              onDelete={() => onDelete(gw)}
              saving={saveLoading && pendingKey === gw.key}
              deleting={deleteLoading && pendingKey === gw.key}
              hasRowOnBackend={!!gatewayRow?.id}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewaySettings;

// ============== ProviderCard ==============

const ProviderCard = ({
  gw,
  form,
  onChangeField,
  onToggleActive,
  onToggleBoolean,
  onSave,
  onDelete,
  saving,
  deleting,
  hasRowOnBackend,
  isCurrentRow,
  t,
}) => {
  const headerBg = form.isActive
    ? "bg-emerald-50/70 border-emerald-200"
    : "bg-[--white-2]/60 border-[--border-1]";
  const HeaderIcon = form.isActive ? ShieldCheck : ShieldX;
  return (
    <section
      className={`rounded-2xl border bg-[--white-1] overflow-hidden ${
        form.isActive ? "border-emerald-200" : "border-[--border-1]"
      }`}
    >
      <header
        className={`flex items-center gap-3 px-4 py-3 border-b ${headerBg}`}
      >
        <span
          className={`grid place-items-center size-9 rounded-xl shrink-0 ${
            form.isActive
              ? "bg-emerald-500 text-white"
              : "bg-[--white-1] text-[--gr-1] ring-1 ring-[--border-1]"
          }`}
        >
          <HeaderIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[--black-1] truncate">
            {t(gw.titleKey)}
          </p>
          <p className="text-[11px] text-[--gr-1] truncate">
            {t(gw.subtitleKey)}
          </p>
        </div>
        {/* Active toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[--gr-1]">
            {t("paymentGateways.active")}
          </span>
          <input
            type="checkbox"
            checked={!!form.isActive}
            onChange={onToggleActive}
            className="peer sr-only"
          />
          <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-[--border-1] transition peer-checked:bg-emerald-500">
            <span className="inline-block size-4 rounded-full bg-white shadow translate-x-0.5 transition peer-checked:translate-x-[1.125rem]" />
          </span>
        </label>
      </header>

      <div className="p-4 space-y-3">
        {gw.fields.map((f) => (
          <CredentialInput
            key={f.name}
            label={t(f.labelKey)}
            secret={!!f.secret}
            placeholder={f.placeholder}
            value={form[f.name] ?? ""}
            onChange={(v) => onChangeField(f.name, v)}
            disabled={saving || deleting}
          />
        ))}

        {gw.booleanField && (
          <label className="flex items-center gap-2 select-none mt-2">
            <input
              type="checkbox"
              checked={!!form[gw.booleanField.name]}
              onChange={() => onToggleBoolean(gw.booleanField.name)}
              className="size-4 rounded border-[--border-1] text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-[--black-2]">
              {t(gw.booleanField.labelKey)}
            </span>
          </label>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
          {isCurrentRow && hasRowOnBackend && (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving || deleting}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-rose-200 text-rose-700 bg-[--white-1] hover:bg-rose-50 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t("paymentGateways.delete")}
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving || deleting}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: PRIMARY_GRADIENT }}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("paymentGateways.save")}
          </button>
        </div>
      </div>
    </section>
  );
};

// ============== CredentialInput ==============

// Masks secret values by default with an eye toggle to reveal. Plain
// text inputs (no `secret`) render as a regular textbox. Renders the
// real value (not a placeholder mask) so paste-and-save works — the
// "mask" is just `type=password` plus the eye toggle.
const CredentialInput = ({
  label,
  secret,
  placeholder,
  value,
  onChange,
  disabled,
}) => {
  const [reveal, setReveal] = useState(false);
  const showAsType = !secret || reveal ? "text" : "password";
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-[--gr-1] mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={showAsType}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          className="w-full h-10 px-3 pr-10 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-2 focus:ring-indigo-100 text-sm font-mono disabled:opacity-60"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            tabIndex={-1}
            aria-label={reveal ? "Hide" : "Show"}
            className="absolute top-1/2 -translate-y-1/2 right-2 grid place-items-center size-7 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition"
          >
            {reveal ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ============== helpers ==============

const emptyFormFor = (gw) => {
  const base = { isActive: false };
  for (const f of gw.fields) base[f.name] = "";
  if (gw.booleanField) base[gw.booleanField.name] = false;
  return base;
};

// Build the local form state from the backend row. The backend stores a
// SINGLE row per restaurant identifying ONE active provider via
// `gatewayType`, so we hydrate that provider's card with the row's
// values and leave the other two empty.
const seedForms = (row) => {
  const forms = {};
  for (const gw of GATEWAYS) {
    forms[gw.key] = emptyFormFor(gw);
  }
  if (!row) return forms;
  const match = GATEWAYS.find((g) => g.gatewayType === row.gatewayType);
  if (!match) return forms;
  const out = { ...emptyFormFor(match), isActive: !!row.isActive };
  for (const f of match.fields) out[f.name] = row[f.name] ?? "";
  if (match.booleanField)
    out[match.booleanField.name] = !!row[match.booleanField.name];
  forms[match.key] = out;
  return forms;
};
