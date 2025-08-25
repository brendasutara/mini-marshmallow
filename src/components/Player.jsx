import {
  useKeyboardControls,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, useRapier, CapsuleCollider } from "@react-three/rapier";
import { useRef, useImperativeHandle, forwardRef } from "react";
import { Controls } from "../App";
import { Vector3, Quaternion, Euler, MathUtils } from "three";

const MOVE_SPEED = 5;
const JUMP_IMPULSE = 3;
const ROTATION_SPEED = 5;
const FRONT_Z = -0.52;

const CAPSULE_RADIUS = 0.25;
const CAPSULE_HALF_HEIGHT = 0.25;
const FOOT = CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT;

export const Player = forwardRef(
  ({ controlsEnabled = true, onWin, ...props }, ref) => {
    const rb = useRef(null);
    const camera = useRef(null);
    const cameraTarget = useRef(new Vector3(0, 0, 0));
    const camStartRef = useRef(new Vector3());
    const camTRef = useRef(0);
    const camResetRef = useRef(false);
    const camTargetLocal = new Vector3(0, 5, 8);
    const punched = useRef(false);
    const prevJump = useRef(false);

    const [, get] = useKeyboardControls();

    const velBuf = useRef(new Vector3()).current;
    const qBuf = useRef(new Quaternion()).current;
    const eulBuf = useRef(new Euler()).current;

    const { rapier, world } = useRapier();
    const scene = useThree((state) => state.scene);

    useFrame(() => {
      const api = rb.current;
      if (!api || !camera.current) return;

      // ---- cámara ----
      const pos = api.translation();
      const playerPos = new Vector3(pos.x, pos.y, pos.z);
      cameraTarget.current.lerp(playerPos, 0.5);
      camera.current.lookAt(cameraTarget.current);

      // Si el juego está ganado, deshabilitar controles y frenar
      if (!controlsEnabled) {
        const lv = api.linvel();
        api.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
        api.setAngvel({ x: 0, y: 0, z: 0 }, true);
        return;
      }

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
      const origin = { x: pos.x, y: pos.y - (FOOT - 0.02), z: pos.z };
      const ray = new rapier.Ray(origin, { x: 0, y: -1, z: 0 });
      const hit = world.castRay(ray, 0.08, true); // ~8cm
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

      const justPressed = j && !prevJump.current;
      prevJump.current = j;
      if (justPressed && grounded) {
        api.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
      }
    });

    const tmpPos = new Vector3();
    const tmpDir = new Vector3();

    const teleport = () => {
      if (!rb.current) return;
      const outMesh = scene.getObjectByName("gateLargeWide_teamYellow");
      if (!outMesh) return;

      outMesh.getWorldPosition(tmpPos);
      outMesh.getWorldDirection(tmpDir);

      const forwardOffset = 1.2;
      tmpPos.add(tmpDir.multiplyScalar(forwardOffset));
      tmpPos.y += FOOT + 0.1;

      rb.current.setTranslation(
        { x: tmpPos.x, y: tmpPos.y, z: tmpPos.z },
        true
      );
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    };

    const respawn = () => {
      const api = rb.current;
      if (!api) return;
      api.setTranslation({ x: 0, y: 5, z: 0 }, true);
      api.setLinvel({ x: 0, y: 0, z: 0 }, true);
      api.setAngvel({ x: 0, y: 0, z: 0 }, true);
      punched.current = false;
      prevJump.current = false;
    };

    useImperativeHandle(
      ref,
      () => ({
        respawn,
        resetCamera: () => {
          if (camera.current) {
            camera.current.position.set(0, 5, 8);
            camera.current.lookAt(0, 0, 0);
          }
        },
      }),
      []
    );

    return (
      <RigidBody
        ref={rb}
        position={[0, 0.8, 0]}
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
          if (other.rigidBodyObject?.name === "space") respawn();
          if (other.rigidBodyObject?.name === "gateIn") teleport();
          if (other.rigidBodyObject?.name === "win") {
            onWin?.();
          }
        }}
        {...props}
      >
        <PerspectiveCamera makeDefault position={[0, 5, 8]} ref={camera} />

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
            <meshStandardMaterial
              color="#ff7fa1"
              roughness={0.5}
              metalness={0}
            />
          </mesh>
        </group>

        <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} />
      </RigidBody>
    );
  }
);
