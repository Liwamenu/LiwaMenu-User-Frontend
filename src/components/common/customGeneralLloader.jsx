// Global loading overlay shown by PopupContext while any redux thunk is
// in flight (counted by middlewares/loadingMiddleware). The popup wraps
// us in a full-width white card; this component just lays out the
// LiwaMenu wave-glow brand spinner inside that card.
//
// Class names are prefixed with `lwm-` so the keyframes/styles don't
// leak into other parts of the app — the <style> block is global.

const CustomGeneralLoader = () => {
  return (
    <div className="lwm-loader-wrapper">
      <div className="lwm-letters-row">
        {"LiwaMenu".split("").map((ch, i) => (
          <span key={i} className="lwm-letter">
            {ch}
          </span>
        ))}
      </div>
      <div className="lwm-progress-bar" aria-hidden="true">
        <div className="lwm-progress-line" />
      </div>

      <style>
        {`
          .lwm-loader-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.2rem;
            background: transparent;
            font-family: 'Conthrax', 'Inter', sans-serif;
          }

          .lwm-letters-row {
            display: flex;
            gap: 0.35rem;
            position: relative;
          }

          .lwm-letter {
            color: darkblue;
            font-size: 2.1rem;
            font-weight: 700;
            display: inline-block;
            opacity: 0.4;
            transform: translateY(0);
            animation: lwm-wave-glow 2s ease-in-out infinite;
            filter: blur(0.5px);
          }

          .lwm-letter:nth-child(1) { animation-delay: 0.0s; }
          .lwm-letter:nth-child(2) { animation-delay: 0.1s; }
          .lwm-letter:nth-child(3) { animation-delay: 0.2s; }
          .lwm-letter:nth-child(4) { animation-delay: 0.3s; }
          .lwm-letter:nth-child(5) { animation-delay: 0.4s; }
          .lwm-letter:nth-child(6) { animation-delay: 0.5s; }
          .lwm-letter:nth-child(7) { animation-delay: 0.6s; }
          .lwm-letter:nth-child(8) { animation-delay: 0.7s; }

          @keyframes lwm-wave-glow {
            0%, 100% {
              opacity: 0.4;
              transform: translateY(0);
              filter: blur(0.5px);
              color: darkblue;
            }
            50% {
              opacity: 1;
              transform: translateY(-10px);
              filter: blur(0px);
              color: #bae6fd;
              text-shadow: 0 0 15px #38bdf8, 0 0 30px #0ea5e9;
            }
          }

          .lwm-progress-bar {
            width: 140px;
            height: 1.5px;
            background: rgba(0, 0, 139, 0.2);
            position: relative;
            overflow: hidden;
            border-radius: 2px;
          }

          .lwm-progress-line {
            position: absolute;
            width: 50%;
            height: 100%;
            background: #38bdf8;
            box-shadow: 0 0 10px #38bdf8, 0 0 20px #0284c7;
            animation: lwm-slide 1.8s ease-in-out infinite;
          }

          @keyframes lwm-slide {
            0% { left: -50%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default CustomGeneralLoader;
