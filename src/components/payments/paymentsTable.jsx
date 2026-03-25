import {
  copyToClipboard,
  formatDateString,
  formatToPrice,
} from "../../utils/utils";
import PaymentMethod from "../../enums/paymentMethods";
import paymentLicenseType from "../../enums/paymentLicenseType";
import statuses from "../../enums/statuses";

const PaymentsTable = ({ payments }) => {
  //filter the file path
  function formatFilePath(filePath) {
    if (!filePath) return null;
    const baseUrl = import.meta.env.VITE_BASE_URL;
    let formattedPath = filePath.replace(
      /^C:\\inetpub\\wwwroot\\PentegrasyonAPI/,
      "",
    );
    formattedPath = formattedPath.replace(
      "C:\\inetpub\\wwwroot\\DEVELOPMENT",
      "",
    );
    formattedPath = formattedPath.replace(
      "C:\\inetpub\\wwwroot\\PRODUCTION",
      "",
    );

    const urlPath = formattedPath.replace(/\\/g, "/");
    return baseUrl.replace("/api/v1/", "") + urlPath;
  }
  // console.log(payments);

  return (
    <main className="max-xl:overflow-x-scroll">
      <div className="min-h-[30rem] border border-solid border-[--light-4] rounded-lg min-w-[70rem] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[--light-3] h-8 text-left text-[--black-1] whitespace-nowrap">
              <th className="pl-4 font-normal">Kullanıcı Adı</th>
              <th className="font-normal">İletişim</th>
              <th className="font-normal">Ödeme Tipi</th>
              <th className="font-normal">Lisans Tipi</th>
              <th className="font-normal">Tutar</th>
              <th className="font-normal">Tarih</th>
              <th className="font-normal">Sip.No</th>
              <th className="font-normal">Durum</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((data, index) => (
              <tr
                key={data.id}
                className={`font-light odd:bg-[--white-1] even:bg-[--table-odd] h-14 border border-solid border-[--light-4] border-x-0 hover:bg-[--light-3] transition-colors ${
                  payments.length < 8 ? "" : "last:border-b-0"
                } `}
              >
                <td className="whitespace-nowrap text-[--black-2] pl-4">
                  {data.userName}
                </td>
                <td className="whitespace-nowrap text-[--black-2]">
                  <p className="flex flex-col text-xs gap-1">
                    <span
                      className="cursor-pointer hover:text-[--primary-1]"
                      onClick={() =>
                        copyToClipboard({ text: data.customerEmail })
                      }
                    >
                      {data.customerEmail}
                    </span>
                    <span
                      className="cursor-pointer hover:text-[--primary-1]"
                      onClick={() =>
                        copyToClipboard({ text: data.customerPhone })
                      }
                    >
                      {data.customerPhone}
                    </span>
                  </p>
                </td>

                <td className="whitespace-nowrap text-[--black-2] font-light">
                  <a
                    href={formatFilePath(data.receiptFilePath)}
                    target="_blank"
                    className={`px-1 py-1.5 ${
                      formatFilePath(data.receiptFilePath)
                        ? "border border-[--primary-1] rounded-md hover:cursor-pointer"
                        : "pointer-events-none"
                    }`}
                  >
                    {PaymentMethod.find(
                      (method) => method.value === data.paymentMethod,
                    )?.label || data.paymentMethod}
                  </a>
                </td>

                <td className="whitespace-nowrap text-[--black-2] font-light">
                  {paymentLicenseType.find(
                    (method) => method.value === data.licenseType,
                  )?.label || data.licenseType}
                </td>

                <td className="whitespace-nowrap text-[--black-2] font-light">
                  {formatToPrice(data.amount) || "0.00"}
                </td>
                <td className="whitespace-nowrap text-[--black-2]">
                  <span>
                    {formatDateString({ dateString: data.createdDateTime })}
                  </span>
                </td>
                <td className="whitespace-nowrap text-[--black-2] font-light">
                  {data.orderNumber}
                </td>

                <td className="whitespace-nowrap text-[--black-2] font-light relative">
                  <span
                    className={`text-xs font-normal px-3 py-1 border border-solid rounded-full ${paymentStatus(data).statusClass} `}
                  >
                    ● {statuses.find((s) => s.value === data.status)?.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default PaymentsTable;

function paymentStatus(payment) {
  const paymentStat = payment.status;
  const status = statuses.find((s) => s.value === paymentStat)?.value;
  const waiting = "text-[--yellow-1] bg-[--status-yellow] border-[--yellow-1]";
  const success = "text-[--green-1] bg-[--status-green] border-[--green-1]";
  const canceled = "text-[--red-1] bg-[--status-red] border-[--red-1]";
  const statusClass =
    status === "Waiting" ? waiting : status === "Success" ? success : canceled;

  return { statusClass };
}
