//MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

//COMP
import PaymentsTable from "../paymentsTable";
import TableSkeleton from "../../common/tableSkeleton";
import CustomPagination from "../../common/pagination";

//REDUX
import {
  getPayments,
  resetGetPaymentsState,
} from "../../../redux/payments/getPaymentsSlice";
import { formatDate } from "../../../utils/utils";
import FilterPayments from "../components/filterPayments";
import SearchPayment from "../components/searchPayment";

const PaymentsPage = () => {
  const dispatch = useDispatch();
  const { loading, success, error, payments } = useSelector(
    (state) => state.payments.get,
  );

  const [searchVal, setSearchVal] = useState("");
  const [filter, setFilter] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [totalItems, setTotalItems] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const itemsPerPage = import.meta.env.VITE_ROWS_PER_PAGE;

  const handlePageChange = (number) => {
    const filterData = {
      pageNumber: number,
      pageSize: itemsPerPage,
      searchKey: searchVal,
      startDateTime: filter?.endDateTime
        ? formatDate(filter?.startDateTime)
        : null,
      endDateTime: filter?.endDateTime ? formatDate(filter.endDateTime) : null,
      status: filter?.statusId,
      type: filter?.typeId,
    };

    dispatch(getPayments(filterData));
  };

  useEffect(() => {
    if (!paymentsData) {
      dispatch(getPayments({ pageNumber, pageSize: itemsPerPage }));
    }
  }, [paymentsData]);

  // TOAST AND GET USERS
  useEffect(() => {
    if (error) {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
      dispatch(resetGetPaymentsState());
    }

    if (success) {
      setPaymentsData(payments.data);
      setTotalItems(payments?.totalCount);
      dispatch(resetGetPaymentsState());
    }
  }, [loading, success, error, payments]);

  return (
    <section className="lg:ml-[280px] pt-16 sm:pt-16 px-[4%] pb-4 grid grid-cols-1 section_row customInput">
      {/* TITLE */}
      <div className="w-full text-[--black-2] py-4 text-2xl font-semibold">
        <h2>Ödemeler</h2>
      </div>

      {/* ACTIONS/BUTTONS */}
      <div className="w-full flex justify-between items-end mb-6 flex-wrap gap-2">
        <SearchPayment
          filter={filter}
          searchVal={searchVal}
          pageNumber={pageNumber}
          setSearchVal={setSearchVal}
          itemsPerPage={itemsPerPage}
          setPageNumber={setPageNumber}
        />

        <div className="max-sm:w-full flex justify-end">
          <div className="flex gap-2 max-sm:order-1 ">
            <FilterPayments
              filter={filter}
              setFilter={setFilter}
              searchVal={searchVal}
              pageNumber={pageNumber}
              itemsPerPage={itemsPerPage}
              setPageNumber={setPageNumber}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      {paymentsData && !loading ? (
        <PaymentsTable payments={paymentsData} />
      ) : loading || !paymentsData ? (
        <TableSkeleton />
      ) : null}

      {/* PAGINATION */}
      {paymentsData && typeof totalItems === "number" && (
        <div className="w-full self-end flex justify-center pb-4 text-[--black-2]">
          <CustomPagination
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            handlePageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
};

export default PaymentsPage;
