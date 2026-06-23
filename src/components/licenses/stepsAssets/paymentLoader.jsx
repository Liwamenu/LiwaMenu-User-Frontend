import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PaymentLoader({ type }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white backdrop-blur rounded-3xl p-10 shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="mb-8">
            {type == 1 ? <PaymentBank /> : <PaymentCard />}
          </div>

          <LoadingSpinner />

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              {t("payment.processing_title")}
            </h2>
            <p className="text-gray-600">
              {t("payment.processing_desc")}
            </p>
          </div>

          <ProgressBar />
        </div>

        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-violet-600 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600 rounded-full filter blur-3xl" />
        </div>
      </div>
    </div>
  );
}

function PaymentBank() {
  return null;
}

function PaymentCard() {
  return (
    <div className="perspective-1000">
      <div className="relative w-48 h-28 mx-auto transform-gpu animate-float">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-2xl shadow-xl">
          <div className="absolute top-4 left-4 w-12 h-8 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-md opacity-90" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="space-y-2">
              <div className="h-1 bg-gray-200/30 rounded-full w-3/4" />
              <div className="h-1 bg-gray-200/30 rounded-full w-1/2" />
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-white/70 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600/20" />
      </div>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="mt-8">
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full animate-progress" />
      </div>
    </div>
  );
}
