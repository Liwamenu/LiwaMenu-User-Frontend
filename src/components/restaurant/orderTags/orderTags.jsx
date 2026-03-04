//MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

//COMP
import DeleteOrderTag from "./deleteOrderTag";
import { CancelI } from "../../../assets/icon";
import { usePopup } from "../../../context/PopupContext";
import { NewOrderTagGroup } from "./components/constraints";
import OrderTagGroupCard from "./components/_orderTagGroupCard";

//REDUX
import { getProducts } from "../../../redux/products/getProductsSlice";
import { addOrderTag } from "../../../redux/orderTags/addOrderTagSlice";
import { getOrderTags } from "../../../redux/orderTags/getOrderTagsSlice";
import { editOrderTags } from "../../../redux/orderTags/editOrderTagsSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";
import { resetEditOrderTags } from "../../../redux/orderTags/editOrderTagsSlice";

const OrderTags = () => {
  const params = useParams();
  const restaurantId = params.id;
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { products } = useSelector((s) => s.products.get);
  const { orderTags } = useSelector((s) => s.orderTags.get);
  const { categories } = useSelector((s) => s.categories.get);
  const { success, error } = useSelector((s) => s.orderTags.editAll);

  const [state, setState] = useState({
    categories: [],
    products: [],
    tagGroups: [],
  });

  const dirtyCount = state?.tagGroups?.filter((g) => g.isDirty).length;

  const handleUpdateGroup = (groupId, updates) => {
    setState((prev) => ({
      ...prev,
      tagGroups: prev.tagGroups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g,
      ),
    }));
  };

  const handleDeleteGroup = (group) => {
    setPopupContent(
      <DeleteOrderTag
        group={group}
        onDelete={() => {
          setState((prev) => ({
            ...prev,
            tagGroups: prev.tagGroups.filter((g) => g.id !== group.id),
          }));
        }}
      />,
    );
  };

  const handleAddGroup = () => {
    const hasUnsavedNew = state.tagGroups.some((g) => g.isNew);
    if (hasUnsavedNew) {
      toast.error("Lütfen önce mevcut yeni grubu tamamlayın", "error");
      return;
    }

    setState((prev) => ({
      ...prev,
      tagGroups: [
        ...prev.tagGroups,
        { ...NewOrderTagGroup, sortOrder: prev.tagGroups.length - 1 },
      ],
    }));

    // Auto-scroll to bottom
    setTimeout(
      () =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        }),
      100,
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(state.tagGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sortOrder for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index,
      isDirty: true,
    }));

    setState((prev) => ({
      ...prev,
      tagGroups: updatedItems,
    }));
  };

  const handleSaveAll = () => {
    // Simple validation: groups must have name and at least one item
    const invalidGroups = state.tagGroups.filter(
      (g) => !g.name.trim() || g.items.length === 0,
    );
    if (invalidGroups.length > 0) {
      toast.error(
        "Lütfen tüm grupların adlarını girin ve en az bir seçenek ekleyin.",
      );
      return;
    }

    //filter the new ones
    const dataToBeAdded = state.tagGroups.filter((g) => g.isNew);
    const dataToBeEdited = state.tagGroups.filter((g) => !g.isNew && g.isDirty);

    if (dataToBeEdited.length > 0) {
      dispatch(editOrderTags({ data: dataToBeEdited, restaurantId }));
    }

    if (dataToBeAdded.length > 0) {
      dispatch(addOrderTag({ data: dataToBeAdded, restaurantId }));
      console.log("DataToBeAdded:", { data: dataToBeAdded, restaurantId });
    }

    console.log("DataToBeUpdated:", { data: dataToBeEdited, restaurantId });
  };

  //GET CATEGORIES, PRODUCTS, TAGGROUPS
  useEffect(() => {
    if (!categories) dispatch(getCategories({ restaurantId }));
    if (!products) dispatch(getProducts({ restaurantId }));
    if (!orderTags) dispatch(getOrderTags({ restaurantId }));
  }, [categories, products, orderTags]);

  //SET CATEGORIES, PRODUCTS, TAGGROUPS TO STATE
  useEffect(() => {
    if (categories) {
      setState((prev) => ({
        ...prev,
        categories: categories,
      }));
    }
    if (products) {
      setState((prev) => ({
        ...prev,
        products: products,
      }));
    }
    if (orderTags) {
      setState((prev) => ({
        ...prev,
        tagGroups: orderTags,
      }));
    }
  }, [categories, products, orderTags]);

  //TOAST ON EDITALL
  useEffect(() => {
    if (success) {
      toast.success("Ürün Etiket Yönetimi kaydedildi", {
        id: "save-order-tags",
      });
      dispatch(resetEditOrderTags());
      setState((prev) => ({
        ...prev,
        tagGroups: prev.tagGroups.map((g) => ({
          ...g,
          isDirty: false,
          isNew: false,
        })),
      }));
    }
    if (error) dispatch(resetEditOrderTags());
  }, [success, error]);

  return (
    <div className="min-h-screen">
      <header className="shadow-xl sticky top-0 z-50 bg-[--primary-1] text-[--white-1]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl text-white font-extrabold tracking-tight">
              Ürün Etiket Yönetimi
            </h1>
          </div>

          <div className="flex gap-3 items-center">
            {dirtyCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-6 py-2.5 rounded-md transition-all shadow-md flex items-center gap-2 text-sm animate-fade-in bg-[--red-1] hover:bg-[--red-2] text-[--white-1]"
              >
                Tüm Değişiklikleri Kaydet
              </button>
            )}

            <button
              type="button"
              onClick={handleAddGroup}
              disabled={state?.tagGroups?.some((g) => g.isNew)}
              className="px-6 py-2.5 rounded-md transition-all shadow-md flex items-center gap-2 text-sm bg-[--green-1] hover:bg-[--green-2] text-[--white-1] disabled:bg-[--gr-2]"
            >
              <CancelI className="size-[1rem] rotate-45" /> Etiket Gurubu Ekle
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8">
        {state.tagGroups?.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed bg-[--white-1] border-[--border-1]">
            <h3 className="text-xl font-bold text-[--gr-2]">
              Henüz bir etiket grubu oluşturulmadı
            </h3>
            <p className="mt-2 text-[--gr-2]">
              Başlamak için sağ üstteki butona tıklayın.
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tag-groups">
              {(provided) => (
                <div
                  className="space-y-2 overflow-x-auto overflow-y-clip pb-60"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {state.tagGroups?.map((group, index) => (
                    <Draggable
                      key={group.id}
                      draggableId={group.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="min-w-min"
                        >
                          <OrderTagGroupCard
                            group={group}
                            products={state.products}
                            categories={state.categories}
                            restaurantId={restaurantId}
                            onUpdate={(u) => handleUpdateGroup(group.id, u)}
                            onDelete={() => handleDeleteGroup(group)}
                            onCancelNew={() =>
                              setState((prev) => ({
                                ...prev,
                                tagGroups: prev.tagGroups.filter(
                                  (g) => g.id !== group.id,
                                ),
                              }))
                            }
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </main>
    </div>
  );
};

export default OrderTags;
