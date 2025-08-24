import {
  useKeyboardControls,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, useRapier, CapsuleCollider } from "@react-three/rapier";
import { useRef } from "react";
import { Controls } from "../App";
import { Vector3, Quaternion, Euler } from "three";
import { useThree } from "@react-three/fiber";

const MOVE_SPEED = 5;
const JUMP_IMPULSE = 3;
const ROTATION_SPEED = 5;
const FRONT_Z = -0.52;

// dimensiones de la cápsula (1x1 total)
const CAPSULE_RADIUS = 0.25;
const CAPSULE_HALF_HEIGHT = 0.25;
const FOOT = CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT; // 0.5

export const Player = () => {
  const rb = useRef(null);
  const camera = useRef(null);
  const cameraTarget = useRef(new Vector3(0, 0, 0));
  const punched = useRef(false);
  const prevJump = useRef(false); // edge detection

  const [, get] = useKeyboardControls();

  // buffers
  const velBuf = useRef(new Vector3()).current;
  const qBuf = useRef(new Quaternion()).current;
  const eulBuf = useRef(new Euler()).current;

  const { rapier, world } = useRapier();

  useFrame(() => {
    const api = rb.current;
    if (!api || !camera.current) return;

    // ---- cámara ----
    const pos = api.translation();
    const playerPos = new Vector3(pos.x, pos.y, pos.z);
    cameraTarget.current.lerp(playerPos, 0.5);
    camera.current.lookAt(cameraTarget.current);

    const f = get()[Controls.forward];
    const b = get()[Controls.back];
    const l = get()[Controls.left];
    const r = get()[Controls.right];
    const j = get()[Controls.jump];

    // ---- rotación Y ----
    const rotVel = { x: 0, y: 0, z: 0 };
    if (l) rotVel.y += ROTATION_SPEED;
    if (r) rotVel.y -= ROTATION_SPEED;
    api.setAngvel(rotVel, true);

    // ---- grounded (ray corto bajo la suela) ----
    // origen 2cm por encima de la base de la cápsula
    const origin = { x: pos.x, y: pos.y - (FOOT - 0.02), z: pos.z };
    const ray = new rapier.Ray(origin, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 0.08, true); // 8cm hacia abajo
    const grounded = !!hit;

    // ---- velocidad local X/Z ----
    let vx = 0,
      vz = 0;
    if (f) vz -= 1;
    if (b) vz += 1;

    const linvel = api.linvel();
    const control = grounded ? 1 : 0.5;

    if (vx !== 0 || vz !== 0) {
      const len = Math.hypot(vx, vz);
      vx = (vx / len) * MOVE_SPEED * control;
      vz = (vz / len) * MOVE_SPEED * control;
    }

    if (punched.current) {
      vx = 0;
      vz = 0;
    }

    // llevar a mundo según rotación actual
    const rot = api.rotation();
    qBuf.set(rot.x, rot.y, rot.z, rot.w);
    eulBuf.setFromQuaternion(qBuf);

    velBuf.set(vx, 0, vz).applyEuler(eulBuf);

    // aplicar vel (preserva Y)
    api.setLinvel({ x: velBuf.x, y: linvel.y, z: velBuf.z }, true);

    // ---- salto: 1 impulso solo al presionar y si grounded ----
    const justPressed = j && !prevJump.current;
    prevJump.current = j;
    if (justPressed && grounded) {
      api.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
    }
  });

  const respawn = () => {
    const api = rb.current;
    if (!api) return;
    api.setTranslation({ x: 0, y: 5, z: 0 });
    api.setLinvel({ x: 0, y: 0, z: 0 });
  };

  const scene = useThree((state) => state.scene);

  const tmpPos = new Vector3();
  const tmpDir = new Vector3();

  const teleport = () => {
    if (!rb.current) return;

    // 1) tomar el mesh de salida
    const outMesh = scene.getObjectByName("gateLargeWide_teamYellow");
    if (!outMesh) return;

    // 2) posición mundial del arco
    outMesh.getWorldPosition(tmpPos);

    // 3) dirección "frente" del arco en mundo
    // (getWorldDirection devuelve el -Z local del mesh; sirve para empujar hacia adelante)
    outMesh.getWorldDirection(tmpDir);

    // 4) construir destino:
    //    - adelantamos 1.2u para no quedar dentro del arco
    //    - levantamos FOOT + 0.1u para que la base de la cápsula apoye sobre el suelo
    const forwardOffset = 1.2;
    tmpPos.add(tmpDir.multiplyScalar(forwardOffset));
    tmpPos.y += FOOT + 0.1; // FOOT = 0.5 → base queda ~0.6 por encima del mesh

    // 5) aplicar teleport y resetear velocidades
    rb.current.setTranslation({ x: tmpPos.x, y: tmpPos.y, z: tmpPos.z }, true);
    rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  return (
    <RigidBody
      ref={rb}
      position={[0, 0.8, 0]} // centro a 0.5 → base en y=0
      colliders={false}
      gravityScale={2.5}
      enabledRotations={[false, true, false]}
      linearDamping={0.2}
      angularDamping={2}
      friction={0}
      frictionCombineRule="min"
      restitution={0}
      ccd
      onCollisionEnter={({ other }) => {
        if (other.rigidBodyObject?.name === "swiper") {
          punched.current = true;
          setTimeout(() => {
            punched.current = false;
          }, 200);
        }
      }}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBodyObject?.name === "space") {
          respawn();
        }
        if (other.rigidBodyObject?.name === "gateIn") {
          teleport();
        }
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 5, 8]} ref={camera} />

      {/* Visual: sin offset en Y, coincide con el centro del body */}
      <group>
        <RoundedBox
          args={[1, 1, 1]}
          radius={0.28}
          smoothness={10}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#fff6f1" roughness={1} metalness={0} />
        </RoundedBox>

        {/* carita */}
        <mesh position={[-0.2, 0.12, FRONT_Z]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#1c1c1c"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0.2, 0.12, FRONT_Z]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#1c1c1c"
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[-0.16, 0.16, FRONT_Z - 0.01]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.24, 0.16, FRONT_Z - 0.01]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh
          position={[-0.28, -0.02, FRONT_Z - 0.006]}
          rotation={[0, Math.PI, 0]}
        >
          <circleGeometry args={[0.09, 24]} />
          <meshStandardMaterial color="#ffb2c4" roughness={1} />
        </mesh>
        <mesh
          position={[0.28, -0.02, FRONT_Z - 0.006]}
          rotation={[0, Math.PI, 0]}
        >
          <circleGeometry args={[0.09, 24]} />
          <meshStandardMaterial color="#ffb2c4" roughness={1} />
        </mesh>
        <mesh
          position={[0, 0.08, FRONT_Z - 0.01]}
          rotation={[Math.PI, Math.PI, 0]}
        >
          <torusGeometry args={[0.08, 0.015, 16, 64, Math.PI]} />
          <meshStandardMaterial color="#ff7fa1" roughness={0.5} metalness={0} />
        </mesh>

        {/* brazos/pies */}
        <mesh position={[0.55, 0, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fff6f1" roughness={1} />
        </mesh>
        <mesh position={[-0.55, 0, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fff6f1" roughness={1} />
        </mesh>
        <mesh position={[-0.24, -0.46, 0.06]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fff6f1" roughness={1} />
        </mesh>
        <mesh position={[0.24, -0.46, 0.06]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fff6f1" roughness={1} />
        </mesh>
      </group>

      {/* colisionador suave */}
      <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} />
    </RigidBody>
  );
};
