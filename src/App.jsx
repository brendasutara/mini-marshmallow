import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useMemo, useRef, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { Experience } from "./components/Experience";

export const Controls = {
  forward: "forward",
  back: "back",
  left: "left",
  right: "right",
  jump: "jump",
};

function App() {
  const map = useMemo(
    () => [
      { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
      { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
      { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
      { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
      { name: Controls.jump, keys: ["Space"] },
    ],
    []
  );

  const playerRef = useRef(null);
  const [won, setWon] = useState(false);

  const [confettiKey, setConfettiKey] = useState(0);
  const celebrate = () => setConfettiKey((k) => k + 1);

  const restart = () => {
    setWon(false);
    playerRef.current?.respawn?.();
    document.activeElement?.blur?.();
  };

  return (
    <>
      <KeyboardControls map={map}>
        <Canvas camera={{ position: [0, 6, 6], fov: 60 }} shadows>
          <color attach="background" args={["#171720"]} />
          <Physics>
            <Experience
              playerRef={playerRef}
              onWin={() => setWon(true)}
              won={won}
              confettiKey={confettiKey}
            />
          </Physics>
        </Canvas>
      </KeyboardControls>

      {!won && (
        <>
          <button
            onClick={restart}
            style={{
              position: "absolute",
              width: 100,
              top: 20,
              left: 0,
              right: 0,
              margin: "0 auto",
              zIndex: 10,
              padding: "10px 16px",
              border: "none",
              borderRadius: 9999,
              background:
                "linear-gradient(135deg, #ffd6ea 0%, #ffc4e0 40%, #ffb3d6 100%)",
              color: "#3a2b33",
              boxShadow: "0 6px 18px rgba(255, 182, 210, 0.45)",
              fontWeight: 700,
              letterSpacing: "0.2px",
              cursor: "pointer",
              outline: "none",
              transition: "transform .08s ease, box-shadow .2s ease",
            }}
            onMouseDownCapture={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onMouseUp={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
            onPointerDown={(e) =>
              (e.currentTarget.style.transform = "translateY(1px)")
            }
            aria-label="Respawn al inicio"
            title="Respawn ♻️"
          >
            Reiniciar
          </button>

          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 0,
              right: 0,
              margin: "0 auto",
              zIndex: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: 500,
              borderRadius: 9999,
              background: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <p style={{ color: "white" }}>
              "Si algo falla, un F5 te salvará 😁" - Brenda Sutara
            </p>
          </div>
        </>
      )}

      {won && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <style>{`
      @keyframes pop {
        0% { transform: scale(.97); opacity: 0 }
        100% { transform: scale(1); opacity: 1 }
      }
      @keyframes shimmer {
        0% { background-position: 0% 50% }
        100% { background-position: 200% 50% }
      }
    `}</style>

          {/* Marco con borde degradado tipo neón */}
          <div
            style={{
              pointerEvents: "auto",
              width: 380,
              borderRadius: 22,
              padding: 3,
              background:
                "linear-gradient(135deg,#ff7fa1,#9ffacf,#9fd6ff) border-box",
              boxShadow: "0 24px 80px rgba(0,0,0,.45)",
              animation: "pop .18s ease-out",
            }}
          >
            {/* Tarjeta interna glassy en dark */}
            <div
              style={{
                borderRadius: 19,
                padding: 22,
                background:
                  "linear-gradient(180deg, rgba(20,20,28,.92), rgba(13,13,20,.92))",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,.06)",
                color: "#e9ecf1",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow suave decorativo */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: -60,
                  background:
                    "radial-gradient(600px 120px at 120% 0%, rgba(255,182,210,.18), transparent 60%), radial-gradient(420px 120px at -10% 110%, rgba(159,250,207,.15), transparent 60%)",
                  pointerEvents: "none",
                }}
              />

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 14,
                    background:
                      "linear-gradient(135deg,#1b1b26,#242435,#1a1a24)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
                    animation: "shimmer 2.2s linear infinite",
                    backgroundSize: "200% 100%",
                    color: "#ffd6ea",
                    fontSize: 22,
                  }}
                >
                  🎉
                </div>

                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ fontSize: 34, fontWeight: 900 }}>¡Ganaste!</div>
                  <div style={{ opacity: 0.85, marginTop: 4, fontSize: 16 }}>
                    ¡Sos un marshmallow pro! 🍡
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button
                  onClick={restart}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: "none",
                    borderRadius: 9999,
                    background: "linear-gradient(135deg,#b7ffd8,#7ff4c0)",
                    color: "#0f1b16",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 10px 26px rgba(127,244,192,.25)",
                    transition: "transform .08s ease, filter .15s ease",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(.98)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter = "brightness(1.05)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  Jugar otra vez
                </button>

                <button
                  onClick={celebrate}
                  title="¡Más papelitos!"
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: "none",
                    borderRadius: 9999,
                    background: "linear-gradient(135deg,#ffd6ea,#ffb2c4)",
                    color: "#2c0f1f",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 10px 26px rgba(255,178,196,.28)",
                    transition: "transform .08s ease, filter .15s ease",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(.98)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter = "brightness(1.05)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  Festejar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default App;
