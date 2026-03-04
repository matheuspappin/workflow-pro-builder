"use client"

import { useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import * as THREE from "three"

// Shader futurista: gradientes neon animados
const futuristicVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const futuristicFragment = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  varying vec2 vUv;
  void main() {
    float t = uTime * 0.4;
    float n1 = sin(vUv.x * 12.0 + t) * sin(vUv.y * 8.0 + t * 0.8) * 0.5 + 0.5;
    float n2 = sin((vUv.x + vUv.y) * 7.0 + t * 1.3) * 0.5 + 0.5;
    float grid = max(sin(vUv.x * 40.0) * sin(vUv.y * 30.0), 0.0);
    grid = pow(grid, 8.0) * (0.3 + 0.2 * sin(t * 2.0));
    vec3 col = mix(uColor1, uColor2, n1);
    col = mix(col, uColor3, n2 * 0.6);
    col += grid * vec3(1.0, 1.0, 1.0);
    float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    col *= 0.5 + 0.5 * edge;
    gl_FragColor = vec4(col, 0.98);
  }
`

const FUTURISTIC_THEMES = {
  fire: [
    new THREE.Vector3(1, 0.15, 0.05),
    new THREE.Vector3(0.8, 0.35, 0),
    new THREE.Vector3(0.4, 0.05, 0.15),
  ],
  agro: [
    new THREE.Vector3(0, 0.9, 0.5),
    new THREE.Vector3(0.2, 0.6, 0.9),
    new THREE.Vector3(0.05, 0.4, 0.3),
  ],
  dance: [
    new THREE.Vector3(0.8, 0.2, 1),
    new THREE.Vector3(0.5, 0.1, 0.8),
    new THREE.Vector3(1, 0.4, 0.7),
  ],
} as const

interface LineupCard3DProps {
  icon: React.ComponentType<{ className?: string }>
  index: number
  theme?: keyof typeof FUTURISTIC_THEMES
}

function PointerTracker({ pointerRef }: { pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }> }) {
  const { pointer } = useThree()
  const current = useRef({ x: 0, y: 0 })

  useFrame(() => {
    if (!pointerRef.current) return
    current.current.x += (pointer.x - current.current.x) * 0.15
    current.current.y += (pointer.y - current.current.y) * 0.15
    pointerRef.current.x = current.current.x
    pointerRef.current.y = current.current.y
  })

  return null
}

function ViewportProvider({ children }: { children: (aspect: number) => React.ReactNode }) {
  const { viewport } = useThree()
  const aspect = viewport.width / viewport.height
  return <>{children(aspect)}</>
}

function FuturisticPlane({
  index,
  pointerRef,
  aspect,
  theme,
}: {
  index: number
  pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }>
  aspect: number
  theme: keyof typeof FUTURISTIC_THEMES
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const colors = FUTURISTIC_THEMES[theme]

  const planeHeight = 2
  const planeWidth = planeHeight * aspect

  useFrame((state, delta) => {
    if (!meshRef.current || !pointerRef.current) return
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime

    const p = pointerRef.current
    const tiltAmount = 0.25
    targetRotation.current.y = p.hover ? p.x * tiltAmount : 0
    targetRotation.current.x = p.hover ? -p.y * tiltAmount * 0.8 : 0

    const t = 1 - Math.exp(-10 * delta)
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * t
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * t

    meshRef.current.rotation.x = currentRotation.current.x
    meshRef.current.rotation.y = currentRotation.current.y

    const pulse = Math.sin(state.clock.elapsedTime * 0.4 + index * 0.7) * 0.015
    meshRef.current.position.z = pulse
  })

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.08}>
      <mesh ref={meshRef}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={futuristicVertex}
          fragmentShader={futuristicFragment}
          side={THREE.DoubleSide}
          uniforms={{
            uTime: { value: 0 },
            uColor1: { value: colors[0] },
            uColor2: { value: colors[1] },
            uColor3: { value: colors[2] },
          }}
        />
      </mesh>
    </Float>
  )
}

function SceneContent({
  index,
  pointerRef,
  theme,
}: {
  index: number
  pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }>
  theme: keyof typeof FUTURISTIC_THEMES
}) {
  return (
    <>
      <PointerTracker pointerRef={pointerRef} />
      <ambientLight intensity={0.7} />
      <pointLight position={[2, 2, 3]} intensity={1.2} />
      <pointLight position={[-2, -2, 2]} intensity={0.5} />
      <ViewportProvider>
        {(aspect) => <FuturisticPlane index={index} pointerRef={pointerRef} aspect={aspect} theme={theme} />}
      </ViewportProvider>
    </>
  )
}

export function LineupCard3D({ icon: Icon, index, theme = 'fire' }: LineupCard3DProps) {
  const pointerRef = useRef({ x: 0, y: 0, hover: false })
  const cardTheme: keyof typeof FUTURISTIC_THEMES = theme

  return (
    <div
      className="relative h-44 w-full overflow-hidden"
      onMouseEnter={() => { pointerRef.current.hover = true }}
      onMouseLeave={() => {
        pointerRef.current.hover = false
        pointerRef.current.x = 0
        pointerRef.current.y = 0
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.2], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
      >
        <SceneContent index={index} pointerRef={pointerRef} theme={cardTheme} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-4 left-6 flex items-center gap-2 pointer-events-none z-10">
        <Icon className="w-8 h-8 text-white" />
        <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">
          Powered by AKAAI CORE
        </span>
      </div>
    </div>
  )
}
