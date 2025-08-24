import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useMemo, useRef } from "react";
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

  // 👉 ref para llamar playerRef.current.respawn()
  const playerRef = useRef(null);

  return (
    <>
      <KeyboardControls map={map}>
        <Canvas camera={{ position: [0, 6, 6], fov: 60 }} shadows>
          <color attach="background" args={["#171720"]} />
          <Physics>
            <Experience playerRef={playerRef} />
          </Physics>
        </Canvas>
      </KeyboardControls>
      <button
        onClick={() => playerRef.current?.respawn?.()}
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
        onMouseDown={(e) =>
          (e.currentTarget.style.transform = "translateY(1px)")
        }
        onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        aria-label="Respawn at start"
        title="Respawn ♻️"
      >
        Restart
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
          width: 300,
          borderRadius: 9999,
          background: "rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ color: "white" }}>It may fail, nothing a F5 can't fix 😁</p>
      </div>
    </>
  );
}

export default App;
