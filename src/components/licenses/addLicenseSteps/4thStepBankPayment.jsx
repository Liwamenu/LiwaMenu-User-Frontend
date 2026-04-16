import { CopyI } from "../../../assets/icon";
import { copyToClipboard } from "../../../utils/utils";
import BackButton from "../stepsAssets/backButton";
import ForwardButton from "../stepsAssets/forwardButton";

const FourthStepBankPayment = ({ step, setStep }) => {
  //SUBMIT
  function handleSubmit(e) {
    e.preventDefault();
    setStep(5);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <main>
        <h1 className="text-center py-4 text-lg font-bold">
          Pentegrasyon Banka Hesabı
        </h1>

        <div className="flex flex-col gap-0.5 border-2 border-[--light-2] rounded-md">
          <div className="flex gap-2 bg-[--light-1] p-2">
            <p>Banka Adı:</p>
            <p>Garanti Bankası</p>
          </div>
          <div className="flex gap-2 bg-[--light-1] p-2">
            <p>Döviz:</p>
            <p>TL</p>
          </div>
          <div
            className="flex gap-2 bg-[--light-1] p-2 border border-transparent max-w-max rounded-md hover:border-[--primary-1] cursor-pointer"
            onClick={() =>
              copyToClipboard({ text: "TR76 0006 2000 4610 0006 2920 57" })
            }
          >
            <p>IBAN:</p>
            <p className="flex gap-2">
              TR76 0006 2000 4610 0006 2920 57{" "}
              <span>
                <CopyI />
              </span>
            </p>
          </div>
          <div
            className="flex gap-2 bg-[--light-1] p-2  border border-transparent max-w-max rounded-md hover:border-[--primary-1] cursor-pointer"
            onClick={() =>
              copyToClipboard({ text: "Liwa Yazılım San. Tic. Ltd. Şti." })
            }
          >
            <p>Hesap Adı:</p>
            <p className="flex gap-2">
              Liwa Yazılım San. Tic. Ltd. Şti.{" "}
              <span>
                <CopyI />
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* BTNS */}
      <div className="flex gap-3 absolute -bottom-20 -right-0 h-12">
        <BackButton
          text="Geri"
          letIcon={true}
          onClick={() => setStep(step - 2)}
        />
        <ForwardButton text="Devam" letIcon={true} type="submit" />
      </div>
    </form>
  );
};

export default FourthStepBankPayment;
