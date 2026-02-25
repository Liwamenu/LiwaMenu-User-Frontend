//MODULES
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

//COMP
import OptionRow from "./optionRow";
import RelationRow from "./_relationRow";
import { NewOption, NewRelation } from "./constraints";
import CustomInput from "../../../common/customInput";
import CustomCheckbox from "../../../common/customCheckbox";
import { ArrowID, CancelI, DeleteI, DragI } from "../../../../assets/icon";

//REDUX
import {
  editOrderTag,
  resetEditOrderTag,
} from "../../../../redux/orderTags/editOrderTagSlice";
import { addOrderTag } from "../../../../redux/orderTags/addOrderTagSlice";
import toast from "react-hot-toast";

const OrderTagGroupCard = ({
  group,
  products,
  onUpdate,
  onDelete,
  isDragging,
  categories,
  onCancelNew,
  restaurantId,
  dragHandleProps,
}) => {
  const dispatch = useDispatch();

  const { success: editSuccess, error: editError } = useSelector(
    (s) => s.orderTags.edit,
  );
  const { success: addSuccess, error: addError } = useSelector(
    (s) => s.orderTags.add,
  );

  const [isCollapsed, setIsCollapsed] = useState(!group.isNew);
  const [activeTab, setActiveTab] = useState("options");
  const hasNoRelations = group.relations.length === 0;

  const updateItem = (index, updates) => {
    const newItems = group.items.map((item, i) =>
      i === index ? { ...item, ...updates } : item,
    );
    onUpdate({ items: newItems, isDirty: true });
  };

  const deleteItem = (index) => {
    const newItems = group.items.filter((_, i) => i !== index);
    onUpdate({ items: newItems, isDirty: true });
  };

  const addItem = () => {
    onUpdate({
      items: [
        ...group.items,
        { ...NewOption, sortOrder: group.items.length - 1 },
      ],
      isDirty: true,
    });
    if (isCollapsed) setIsCollapsed(false);
  };

  const addRelation = () => {
    onUpdate({ relations: [...group.relations, NewRelation], isDirty: true });
    if (isCollapsed) setIsCollapsed(false);
    setActiveTab("relations");
  };

  const updateRelation = (relId, updates) => {
    const newRels = group.relations.map((rel) =>
      rel.id === relId ? { ...rel, ...updates } : rel,
    );
    onUpdate({ relations: newRels, isDirty: true });
  };

  const deleteRelation = (relId) => {
    const newRels = group.relations.filter((rel) => rel.id !== relId);
    onUpdate({ relations: newRels, isDirty: true });
  };

  const handleItemDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(group.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    onUpdate({ items: updatedItems, isDirty: true });
  };

  function handleUpdateItem(e) {
    e.preventDefault();
    if (group.relations.length === 0) {
      toast.error("Lütfen en az bir ilişki ekleyin");
      return;
    }
    console.log(group);
    group?.isNew
      ? dispatch(addOrderTag({ ...group, restaurantId }))
      : dispatch(editOrderTag({ ...group, restaurantId }));
  }

  useEffect(() => {
    if (editSuccess) {
      toast.success("Etiket gurubu başarıyla güncellendi.");
      dispatch(resetEditOrderTag());
      onUpdate({ isDirty: false, isNew: false });
    }
    if (editError) dispatch(resetEditOrderTag());
  }, [editSuccess, editError]);

  useEffect(() => {
    if (addSuccess) {
      toast.success("Etiket gurubu başarıyla eklendi.");
      dispatch(resetEditOrderTag());
      onUpdate({ isDirty: false, isNew: false });
    }
    if (addError) dispatch(resetEditOrderTag());
  }, [addSuccess, addError]);

  return (
    <form onSubmit={handleUpdateItem}>
      <div
        className={`rounded-xl shadow-sm border transition-all overflow-visible animate-fade-in bg-[--white-1] 
        ${group.isDirty ? "border-[--red-1]" : "border-[--border-1]"}
        ${hasNoRelations && !group.isNew ? "border-[--red-1] bg-[#fff5f5]" : ""}
        ${isDragging ? "shadow-xl scale-[1.02]" : ""}
        `}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-4 bg-[--light-1] border-[--border-1] ${
            isCollapsed ? "rounded-xl" : "rounded-t-xl"
          }`}
        >
          <div className="flex items-center gap-4 flex-grow">
            <span
              className="cursor-move text-xl text-[--primary-1]"
              {...dragHandleProps}
            >
              <DragI />
            </span>

            <div className="flex-grow min-w-60 max-w-[26rem]">
              <CustomInput
                required
                type="text"
                value={group.name}
                onChange={(v) => onUpdate({ name: v, isDirty: true })}
                className="px-3 py-[8px] text-sm rounded-lg font-bold transition-all bg-[--white-1] border-[--border-1] text-[--black-1] placeholder:!text-[--gr-3]"
                placeholder="Gurup Adı"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-lg border shadow-sm text-sm bg-[--white-1] border-[--border-1]">
              <span className="font-semibold text-[--gr-1]">Min:</span>
              <div className="w-20">
                <CustomInput
                  required
                  type="number"
                  value={group.minSelected}
                  onChange={(v) =>
                    onUpdate({
                      minSelected: parseInt(v) || 0,
                      isDirty: true,
                    })
                  }
                  className="text-center font-bold text-[--black-1] bg-transparent px-[5px] py-[5px]"
                />
              </div>
              <span className="mx-1 text-[--gr-3]">|</span>
              <span className="font-semibold text-[--gr-1]">Max:</span>
              <div className="w-20">
                <CustomInput
                  required
                  type="number"
                  value={group.maxSelected}
                  onChange={(v) =>
                    onUpdate({
                      maxSelected: parseInt(v) || 1,
                      isDirty: true,
                    })
                  }
                  className="w-[2.5rem] text-center font-bold text-[--black-1] bg-transparent px-[5px] py-[5px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm bg-[--white-1] border-[--border-1] whitespace-nowrap">
              <CustomCheckbox
                id={`ft-${group.id}`}
                label="Serbest Etiketleme"
                checked={group.freeTagging}
                onChange={(e) =>
                  onUpdate({ freeTagging: e.target.checked, isDirty: true })
                }
                size="4 rounded-[4.5px]"
                className2="text-xs text-[--gr-1]"
              />
            </div>

            {group.isDirty && (
              <button
                type="submit"
                className="px-3 py-2 rounded-md text-xs font-bold animate-pulse transition-colors flex items-center gap-1 bg-[--red-1] hover:bg-[--red-2] text-white"
              >
                Kaydet
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {group.isNew ? (
              <button
                type="button"
                onClick={onCancelNew}
                className="p-1 text-[--red-1]"
                title="İptal"
              >
                <CancelI className="size-[1rem]" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1 text-[--red-1]"
                  title="Sil"
                >
                  <DeleteI className="size-[1rem]" strokeWidth={1.7} />
                </button>
                <div className="w-px h-6 bg-[--border-1]" />
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`p-1 rounded-full transition-transform ${
                    isCollapsed ? "" : "rotate-180"
                  } text-[--primary-1] hover:bg-[--light-1]`}
                >
                  <ArrowID />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        {!isCollapsed && (
          <div className="bg-[--white-1] rounded-b-xl">
            <div className="flex border-b border-[--border-1] bg-[--white-2]">
              <button
                type="button"
                onClick={() => setActiveTab("options")}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                  activeTab === "options"
                    ? "border-[--primary-1] text-[--primary-1] bg-[--white-1]"
                    : "border-transparent text-[--gr-1]"
                }`}
              >
                Etiketler ({group.items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("relations")}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
                  activeTab === "relations"
                    ? "border-[--primary-1] text-[--primary-1] bg-[--white-1]"
                    : "border-transparent text-[--gr-1]"
                }`}
              >
                İlişkili Ürünler ({group.relations.length})
              </button>
            </div>

            <div className="p-4">
              {activeTab === "options" ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-4 py-2 rounded-lg text-sm shadow-sm transition-all flex items-center gap-1 bg-[--green-1] hover:bg-[--green-2] text-[--white-1]"
                    >
                      <CancelI className="size-[1.1rem] rotate-45" /> Seçenek
                      Ekle
                    </button>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-3 py-2 border-b-2 text-[10px] uppercase font-bold tracking-wider border-[--border-1] text-[--primary-1] whitespace-nowrap">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">Seçenek Adı</div>
                    <div className="col-span-2">Fiyatı</div>
                    <div className="col-span-1 text-center">Vars.</div>
                    <div className="col-span-1 text-center">Zorunlu</div>
                    <div className="col-span-1 text-center">Min. Adet</div>
                    <div className="col-span-1 text-center">Max. Adet</div>
                    <div className="col-span-1"></div>
                  </div>

                  <DragDropContext onDragEnd={handleItemDragEnd}>
                    <Droppable droppableId="items">
                      {(provided) => (
                        <div
                          className="space-y-2"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {group.items.map((item, index) => (
                            <Draggable
                              key={index}
                              draggableId={item.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                >
                                  <OptionRow
                                    item={item}
                                    onUpdate={(u) => updateItem(index, u)}
                                    onDelete={() => deleteItem(index)}
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

                  {group.freeTagging && (
                    <div className="border p-4 rounded-xl mt-4 flex items-start gap-3 bg-[--status-yellow] border-[--yellow-1]">
                      <span className="text-xl">💡</span>
                      <div>
                        <h4 className="font-bold text-sm text-[--black-1]">
                          Serbest Etiketleme Etkin
                        </h4>
                        <p className="text-xs mt-1 text-[--black-2]">
                          Kullanıcılar sipariş sırasında ek not girebilecektir.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addRelation}
                      className="px-4 py-2 rounded-lg text-sm shadow-sm transition-all flex items-center gap-1 bg-[--blue-1] hover:bg-[--blue-2] text-[--white-1]"
                    >
                      <CancelI className="size-[1.1rem] rotate-45" /> İlişkili
                      Ürün Ekle
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-3 px-3 py-2 border-b-2 text-[10px] uppercase font-bold tracking-wider border-[--border-1] text-[--blue-1]">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">Kategori</div>
                    <div className="col-span-4">Ürün</div>
                    <div className="col-span-3">Porsiyon</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-2">
                    {group.relations.map((rel) => (
                      <RelationRow
                        key={rel.id}
                        relation={rel}
                        products={products}
                        categories={categories}
                        onUpdate={(u) => updateRelation(rel.id, u)}
                        onDelete={() => deleteRelation(rel.id)}
                      />
                    ))}
                  </div>

                  {group.relations.length === 0 && (
                    <div className="p-8 border-2 border-dashed rounded-xl text-center border-[--red-3]">
                      <p className="font-medium text-sm text-[--red-1]">
                        Bu etiket gurubu için hiç bir ilişki vermediğiniz için
                        seçenekler müşteriye sorulmayacaktır!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default OrderTagGroupCard;
