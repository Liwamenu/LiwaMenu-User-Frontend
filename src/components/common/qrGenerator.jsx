import { QRCodeCanvas } from "qrcode.react";

// Tiny preview QR used in list rows / table chips. Defaults to error-
// correction level "H" (30% redundancy) — same as the full QR page
// generator — so Android scanners that struggle with the LOW level
// recognise the payload as a URL instead of search-engine-ing the
// raw text. Pure square modules (the qrcode.react default), no
// rounded styling, no overlay — Android-friendly out of the box.
const QrGenerator = ({ text }) => {
  return (
    <QRCodeCanvas
      value={text || "default text"}
      size={100}
      bgColor={"#ffffff"}
      fgColor={"#000000"}
      level={"H"}
    />
  );
};

export default QrGenerator;
