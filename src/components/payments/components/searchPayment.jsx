import { useDispatch } from "react-redux";
import { getPayments } from "../../../redux/payments/getPaymentsSlice";
import { formatDate } from "../../../utils/utils";
import CustomInput from "../../common/customInput";
import { CloseI } from "../../../assets/icon";

const SearchPayment = ({
  filter,
  itemsPerPage,
  searchVal,
  setSearchVal,
  pageNumber,
  setPageNumber,
}) => {
  const dispatch = useDispatch();

  const searchData = {
    pageNumber: 1,
    pageSize: itemsPerPage,
    searchKey: searchVal,
    startDateTime: filter?.endDateTime
      ? formatDate(filter.startDateTime)
      : null,
    endDateTime: filter?.endDateTime ? formatDate(filter.endDateTime) : null,
    status: filter?.statusId,
    type: filter?.typeId,
  };

  //SEARCH
  function handleSearch(e) {
    e.preventDefault();
    if (!searchVal) return;
    dispatch(getPayments(searchData));
    setPageNumber(1);
  }

  //CLEAR SEARCH
  function clearSearch() {
    setSearchVal("");
    dispatch(getPayments({ ...searchData, pageNumber, searchKey: null }));
  }

  return (
    <div className="flex items-center w-full max-w-sm max-sm:order-2">
      <form className="w-full" onSubmit={handleSearch}>
        <CustomInput
          onChange={(e) => {
            setSearchVal(e);
            !e && clearSearch();
          }}
          value={searchVal}
          placeholder="Ara..."
          className2="mt-[0px] w-full"
          className="mt-[0px] py-[.7rem] w-[100%] focus:outline-none"
          icon={<CloseI className="w-4 text-[--red-1]" />}
          className4={`top-[20px] right-2 hover:bg-[--light-4] rounded-full px-2 py-1 ${
            searchVal ? "block" : "hidden"
          }`}
          iconClick={clearSearch}
        />
      </form>
    </div>
  );
};

export default SearchPayment;
