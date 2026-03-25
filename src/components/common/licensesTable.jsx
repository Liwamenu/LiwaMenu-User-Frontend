import LicensesActions from "../licenses/actions/licensesActions";
import { formatDateString, getRemainingDays } from "../../utils/utils";
import EditLicenseIsActive from "../licenses/actions/updateLicenseIsActive";

const LicensesTable = ({ inData, totalItems, onSuccess }) => {
  return (
    <main className="max-xl:overflow-x-scroll">
      <div className="min-h-[30rem] border border-solid border-[--light-4] rounded-lg min-w-[60rem] overflow-hidden">
        <table className="w-full text-sm font-light">
          <thead>
            <tr className="bg-[--light-3] h-8 text-left text-[--black-1]">
              <th className="pl-4 font-normal">Restoran</th>
              {inData[0]?.userName && (
                <th className="font-normal">Kullanıcı</th>
              )}
              <th className="font-normal">Bitiş Tarihi</th>
              <th className="font-normal">Kalan Gün</th>
              <th className="font-normal">Durum</th>
              <th className="font-normal text-center">İşlem</th>
            </tr>
          </thead>

          <tbody>
            {inData.map((data, index) => (
              <tr
                key={data.id}
                className={`odd:bg-[--white-1] even:bg-[--table-odd] h-14 border border-solid border-[--light-4] border-x-0 hover:bg-[--light-3] transition-colors ${
                  totalItems < 8 ? "" : "last:border-b-0"
                } `}
              >
                <td className="whitespace-nowrap text-[--black-2] pl-4 font-normal">
                  {data.restaurantName}
                </td>
                {inData[0]?.userName && (
                  <td className="whitespace-nowrap text-[--black-2] font-light">
                    {data.userName}
                  </td>
                )}
                <td className="whitespace-nowrap text-[--black-2] font-light">
                  {formatDateString({ dateString: data.endDateTime })}
                </td>
                <td className="whitespace-nowrap text-[--black-2] font-light">
                  {getRemainingDays(data.endDateTime) > 0 ? (
                    getRemainingDays(data.endDateTime)
                  ) : (
                    <p className="text-[--red-1] font-bold">Süresi bitmiş</p>
                  )}
                </td>
                <td className="whitespace-nowrap text-[--black-2] font-light">
                  <EditLicenseIsActive
                    licenseData={data}
                    onSuccess={onSuccess}
                  />
                </td>
                <td className="whitespace-nowrap w-14 text-[--black-2] font-light relative">
                  <LicensesActions
                    index={index}
                    licenseData={data}
                    itemsPerPage={inData.length}
                    onSuccess={onSuccess}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default LicensesTable;
