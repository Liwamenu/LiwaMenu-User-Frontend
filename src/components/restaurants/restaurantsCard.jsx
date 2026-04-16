import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDateString } from "../../utils/utils";

const RestaurantsCard = ({ inData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function licenseIsClicked(r) {
    r.licenseId
      ? navigate("/licenses/extend-license", {
          state: {
            restaurant: r,
            currentLicense: {
              restaurantName: r.name,
              restaurantId: r.id,
              userId: r.userId,
              id: r.licenseId,
            },
          },
        })
      : navigate("/licenses/add-license", {
          state: { restaurant: r },
        });
  }

  return (
    <main
      className="flex max-sm:flex-col flex-wrap justify-start gap-4 text-[--black-1] mb-8"
      style={{ fontFamily: "Poppins" }}
    >
      {inData.map((r) => (
        <div
          className="w-full max-w-80 min-w-60 border border-[--border-1] rounded-md overflow-clip relative "
          key={r.id}
        >
          <div
            className="hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() =>
              navigate(`/restaurant/edit/${r.id}`, {
                state: { restaurant: r },
              })
            }
          >
            <div className="max-w-lg aspect-square overflow-hidden">
              <img
                src={r.imageAbsoluteUrl}
                alt="liwamenu_restaurant_img"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="w-full bg-[--light-5] py-2 px-2 flex flex-col gap-4 mt-2">
            <p className="text-lg min-w-32 font-medium">{r.name}</p>
            <p className="text-xs text-right text-[--black-2]">{`${r.city}/${r.district}/${inData[0].neighbourhood}`}</p>
          </div>

          <div className="py-2 px-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{t("restaurants.status")}</p>
              <p
                className={`text-sm text-[--green-1] border rounded-md w-28 text-center py-2 ${
                  r.isActive
                    ? "border-[--green-1] bg-[--light-green]"
                    : "border-[--red-1] bg-[--light-red]"
                }`}
              >
                {r.isActive
                  ? t("restaurants.active")
                  : t("restaurants.passive")}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">
                {t("restaurants.license_status")}
              </p>
              <p
                className={`text-sm border rounded-md w-28 text-center py-2 ${
                  r.licenseIsActive
                    ? "border-[--green-1] bg-[--light-green] text-[--green-1]"
                    : "border-[--red-1] bg-[--light-red] text-[--red-1]"
                }`}
              >
                {r.licenseIsActive
                  ? t("restaurants.active")
                  : r.licenseId
                    ? t("restaurants.passive")
                    : t("restaurants.license_no")}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm ">
              <p className="font-medium">{t("restaurants.license")}</p>
              {r.licenseIsActive && !r.licenseIsExpired ? (
                <p className="w-28 flex justify-center py-2 border border-[--border-1] rounded-md">
                  {" "}
                  {formatDateString({ dateString: r.licenseEnd })}
                </p>
              ) : (
                <button
                  className="text-white border border-[--primary-1] bg-[--primary-1] rounded-md w-28 py-2 text-center"
                  onClick={() => licenseIsClicked(r)}
                >
                  {r.licenseIsExpired
                    ? t("restaurants.license_extend")
                    : t("restaurants.license_get")}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </main>
  );
};

export default RestaurantsCard;
