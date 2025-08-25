import { Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Playground } from "./Playground";
import { Player } from "./Player";
import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";

export const Experience = ({ playerRef, onWin, won, confettiKey }) => {
  return (
    <>
      <directionalLight position={[-50, 50, 25]} intensity={0.6} castShadow>
        <PerspectiveCamera attach="shadow-camera" near={55} far={86} fov={80} />
      </directionalLight>
      <directionalLight position={[10, 10, 5]} intensity={0.2} />
      <ambientLight intensity={0.5} />
      <OrbitControls />

      <Player ref={playerRef} controlsEnabled={!won} onWin={onWin} />
      <Playground />

      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        name="space"
        position-y={-5}
      >
        <CuboidCollider args={[100, 1, 100]} />
      </RigidBody>

      {won && <ConfettiRain anchor="button_teamYellow" key={confettiKey} />}

      <Grid
        sectionSize={3}
        sectionColor={"white"}
        sectionThickness={1}
        cellSize={1}
        cellColor={"#ececec"}
        cellThickness={0.6}
        infiniteGrid
        fadeDistance={100}
        fadeStrength={5}
      />
    </>
  );
};

function ConfettiRain({
  anchor = "button_teamYellow",
  count = 120,
  area = 5,
  height = 7,
}) {
  const { scene } = useThree();

  const center = useMemo(() => {
    const v = new Vector3(0, 0, 0);
    const node = scene.getObjectByName(anchor);
    if (node) node.getWorldPosition(v);
    v.y += 1.5;
    return v;
  }, [scene, anchor]);

  const colors = useMemo(
    () => [
      "#ff7fa1",
      "#ffb2c4",
      "#ffd6ea",
      "#a2f2d5",
      "#9fd6ff",
      "#fff6f1",
      "#ffe08a",
    ],
    []
  );

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        dx: (Math.random() - 0.5) * area,
        dz: (Math.random() - 0.5) * area,
        rot: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
      })),
    [count, area, colors]
  );

  return (
    <>
      {items.map(({ key, dx, dz, rot, color }) => (
        <RigidBody
          key={key}
          position={[
            center.x + dx,
            center.y + height + Math.random(),
            center.z + dz,
          ]}
          friction={0.2}
          restitution={0.45}
          ccd
          angularDamping={0.1}
        >
          <mesh rotation-y={rot} castShadow>
            <boxGeometry args={[0.08, 0.01, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
