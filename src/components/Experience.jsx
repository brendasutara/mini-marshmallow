import {
  Gltf,
  Grid,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Player } from "./Player";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Playground } from "./Playground";

export const Experience = () => {
  return (
    <>
      <directionalLight
        position={[-50, 50, 25]}
        intensity={0.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      >
        <PerspectiveCamera
          attach={"shadow-camera"}
          near={55}
          far={86}
          fov={80}
        />
      </directionalLight>
      <directionalLight position={[10, 10, 5]} intensity={0.2} />
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <Player />

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

      {/* <RigidBody
        colliders={false}
        position-x={3}
        position-y={3}
        gravityScale={0.2}
        restitution={1.2}
      >
        <Gltf src="/models/ball.glb" castShadow />
        <BallCollider args={[1]} />
      </RigidBody> */}

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
