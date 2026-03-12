"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Float, useTexture } from "@react-three/drei"
import * as THREE from "three"

// Shader 4D Parallax: vertex displacement para profundidade real + UV offset interativo
const parallaxVertex = `
  uniform vec2 uMouseOffset;
  uniform float uDepthFactor;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Displacement 3D: vértices se deslocam conforme mouse e profundidade (parallax real)
    vec3 pos = position;
    float depthScale = 0.15 * uDepthFactor;
    pos.x += uMouseOffset.x * depthScale;
    pos.y += uMouseOffset.y * depthScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`
const parallaxFragment = `
  uniform sampler2D uTexture;
  uniform vec2 uMouseOffset;
  uniform float uTime;
  uniform float uDepthFactor;
  uniform float uDriftSpeed;
  varying vec2 vUv;
  void main() {
    float driftX = sin(uTime * uDriftSpeed) * 0.025;
    float driftY = cos(uTime * uDriftSpeed * 0.7) * 0.02;
    vec2 offset = uMouseOffset * (0.12 + uDepthFactor * 0.18) + vec2(driftX, driftY);
    vec2 uv = vUv + offset;
    vec4 tex = texture2D(uTexture, uv);
    float edge = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
    edge *= smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x);
    gl_FragColor = vec4(tex.rgb, tex.a * (0.88 + 0.12 * edge));
  }
`

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

// DanceFlow: shader temático — fitas de dança, ondas rítmicas, luzes de palco
const danceFlowVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const danceFlowFragment = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float t = uTime * 1.2;
    // Ondas rítmicas (batida de música)
    float beat = 0.75 + 0.25 * sin(t * 5.0);
    // Fitas verticais fluindo (movimento de dança / coreografia)
    float ribbon1 = sin(vUv.x * 10.0 + t) * sin(vUv.y * 8.0 + t * 0.7) * 0.5 + 0.5;
    float ribbon2 = sin((vUv.x - vUv.y * 1.2) * 6.0 + t * 1.8) * 0.5 + 0.5;
    float ribbon3 = sin((vUv.x + vUv.y) * 4.0 - t * 1.2) * 0.5 + 0.5;
    // Luz de holofote (palco de estúdio)
    vec2 spotCenter = vec2(0.5 + sin(t * 0.4) * 0.12, 0.5 + cos(t * 0.3) * 0.08);
    float spotlight = 1.0 - 0.5 * length(vUv - spotCenter);
    spotlight = pow(max(spotlight, 0.0), 1.2);
    // Cores de estúdio de dança (roxo, magenta, rosa)
    vec3 purple = vec3(0.55, 0.12, 0.92);
    vec3 magenta = vec3(0.92, 0.18, 0.65);
    vec3 pink = vec3(1.0, 0.45, 0.82);
    vec3 col = mix(purple, magenta, ribbon1);
    col = mix(col, pink, ribbon2 * 0.6);
    col += ribbon3 * 0.08 * vec3(1.0, 0.9, 1.0);
    col *= beat * (0.9 + 0.1 * spotlight);
    // Brilho nas bordas (espelho de estúdio)
    float edge = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    col *= 0.65 + 0.35 * edge;
    gl_FragColor = vec4(col, 0.95);
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
  imageSrc?: string
}

// 4D Parallax interativo: 5 camadas de profundidade + tilt 3D + vertex displacement + animação
function ParallaxImagePlane({
  imageSrc,
  pointerRef,
  aspect,
  index,
}: {
  imageSrc: string
  pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }>
  aspect: number
  index: number
}) {
  const { gl } = useThree()
  const texture = useTexture(imageSrc)
  const groupRef = useRef<THREE.Group>(null)
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })

  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = gl.capabilities.getMaxAnisotropy()

  const planeHeight = 2.2
  const planeWidth = planeHeight * aspect

  const layers = useMemo(
    () => [
      { z: -0.25, depthFactor: 0.15, scale: 1.12, driftSpeed: 0.12 },
      { z: -0.1, depthFactor: 0.35, scale: 1.06, driftSpeed: 0.18 },
      { z: 0, depthFactor: 0.6, scale: 1.0, driftSpeed: 0.25 },
      { z: 0.12, depthFactor: 0.82, scale: 0.96, driftSpeed: 0.32 },
      { z: 0.22, depthFactor: 1.0, scale: 0.92, driftSpeed: 0.4 },
    ],
    []
  )

  useFrame((state, delta) => {
    if (!pointerRef.current || !groupRef.current) return
    const p = pointerRef.current
    const t = state.clock.elapsedTime

    // Parallax UV + vertex: forte interação com mouse (profundidade 4D)
    const parallaxStrength = 0.22
    const mx = p.hover ? p.x * parallaxStrength : 0
    const my = p.hover ? p.y * parallaxStrength : 0

    // Tilt 3D no hover: inclinação da cena conforme cursor (efeito "olhar para dentro")
    const tiltAmount = 0.35
    targetRotation.current.y = p.hover ? p.x * tiltAmount : 0
    targetRotation.current.x = p.hover ? -p.y * tiltAmount * 0.7 : 0

    const lerp = 1 - Math.exp(-12 * delta)
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * lerp
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * lerp

    groupRef.current.rotation.x = currentRotation.current.x
    groupRef.current.rotation.y = currentRotation.current.y

    // Pulso sutil + float
    const pulse = Math.sin(t * 0.4 + index * 0.7) * 0.012
    groupRef.current.position.z = pulse

    groupRef.current.children.forEach((mesh, i) => {
      const mat = (mesh as THREE.Mesh).material as THREE.ShaderMaterial
      if (mat?.uniforms) {
        mat.uniforms.uMouseOffset.value.set(mx, my)
        mat.uniforms.uTime.value = t
      }
    })
  })

  return (
    <Float speed={1.2} rotationIntensity={0} floatIntensity={0.06}>
      <group ref={groupRef}>
        {layers.map((layer, i) => (
          <mesh key={i} position={[0, 0, layer.z]}>
            <planeGeometry args={[planeWidth * layer.scale, planeHeight * layer.scale]} />
            <shaderMaterial
              vertexShader={parallaxVertex}
              fragmentShader={parallaxFragment}
              side={THREE.DoubleSide}
              transparent
              depthWrite={i === 2}
              uniforms={{
                uTexture: { value: texture },
                uMouseOffset: { value: new THREE.Vector2(0, 0) },
                uTime: { value: 0 },
                uDepthFactor: { value: layer.depthFactor },
                uDriftSpeed: { value: layer.driftSpeed },
              }}
            />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

function PointerTracker({ pointerRef }: { pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }> }) {
  const { pointer } = useThree()
  const current = useRef({ x: 0, y: 0 })

  useFrame(() => {
    if (!pointerRef.current) return
    current.current.x += (pointer.x - current.current.x) * 0.22
    current.current.y += (pointer.y - current.current.y) * 0.22
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

// Partículas de movimento (traços de dança)
function DanceFlowParticles({ pointerRef }: { pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }> }) {
  const count = 80
  const { positions, phases, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const phs = new Float32Array(count)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2
      pos[i * 3 + 2] = 0.02
      phs[i] = Math.random() * Math.PI * 2
      spd[i] = 0.8 + Math.random() * 1.2
    }
    return { positions: pos, phases: phs, speeds: spd }
  }, [])

  const pointsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const danceParticleVertex = `
    attribute float aPhase;
    attribute float aSpeed;
    uniform float uTime;
    varying float vAlpha;
    void main() {
      float wave = sin(position.x * 3.0 + uTime * aSpeed + aPhase) * 0.15;
      vec3 pos = position + vec3(0.0, wave, 0.0);
      vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + aPhase);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 3.0 * (0.8 + 0.2 * sin(uTime + aPhase));
    }
  `
  const danceParticleFragment = `
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float alpha = (1.0 - smoothstep(0.0, 1.0, d)) * vAlpha * 0.9;
      vec3 col = mix(vec3(1.0, 0.5, 0.9), vec3(0.8, 0.3, 1.0), gl_PointCoord.x);
      gl_FragColor = vec4(col, alpha);
    }
  `

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    if (pointsRef.current && pointerRef.current?.hover) {
      pointsRef.current.rotation.z += 0.002 * pointerRef.current.x
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={danceParticleVertex}
        fragmentShader={danceParticleFragment}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 } }}
      />
    </points>
  )
}

// Cena DanceFlow: fitas, partículas e animação rítmica
function DanceFlowPlane({
  index,
  pointerRef,
  aspect,
}: {
  index: number
  pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }>
  aspect: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })

  const planeHeight = 2
  const planeWidth = planeHeight * aspect

  useFrame((state, delta) => {
    if (!meshRef.current || !pointerRef.current) return
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime

    const p = pointerRef.current
    const tiltAmount = 0.3
    targetRotation.current.y = p.hover ? p.x * tiltAmount : 0
    targetRotation.current.x = p.hover ? -p.y * tiltAmount * 0.6 : 0

    const t = 1 - Math.exp(-8 * delta)
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * t
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * t

    meshRef.current.rotation.x = currentRotation.current.x
    meshRef.current.rotation.y = currentRotation.current.y

    const pulse = Math.sin(state.clock.elapsedTime * 1.5 + index * 0.7) * 0.02
    meshRef.current.position.z = pulse
  })

  return (
    <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.12}>
      <group>
        <mesh ref={meshRef}>
          <planeGeometry args={[planeWidth, planeHeight]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={danceFlowVertex}
            fragmentShader={danceFlowFragment}
            side={THREE.DoubleSide}
            uniforms={{ uTime: { value: 0 } }}
          />
        </mesh>
        <DanceFlowParticles pointerRef={pointerRef} />
      </group>
    </Float>
  )
}

function SceneContent({
  index,
  pointerRef,
  theme,
  imageSrc,
}: {
  index: number
  pointerRef: React.RefObject<{ x: number; y: number; hover: boolean }>
  theme: keyof typeof FUTURISTIC_THEMES
  imageSrc?: string
}) {
  return (
    <>
      <PointerTracker pointerRef={pointerRef} />
      <ambientLight intensity={0.7} />
      <pointLight position={[2, 2, 3]} intensity={1.2} />
      <pointLight position={[-2, -2, 2]} intensity={0.5} />
      <ViewportProvider>
        {(aspect) =>
          imageSrc ? (
            <Suspense fallback={null}>
              <ParallaxImagePlane imageSrc={imageSrc} pointerRef={pointerRef} aspect={aspect} index={index} />
            </Suspense>
          ) : theme === "dance" ? (
            <DanceFlowPlane index={index} pointerRef={pointerRef} aspect={aspect} />
          ) : (
            <FuturisticPlane index={index} pointerRef={pointerRef} aspect={aspect} theme={theme} />
          )
        }
      </ViewportProvider>
    </>
  )
}

export function LineupCard3D({ icon: Icon, index, theme = 'fire', imageSrc }: LineupCard3DProps) {
  const pointerRef = useRef({ x: 0, y: 0, hover: false })
  const cardTheme: keyof typeof FUTURISTIC_THEMES = theme

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => { pointerRef.current.hover = true }}
      onMouseLeave={() => {
        pointerRef.current.hover = false
        pointerRef.current.x = 0
        pointerRef.current.y = 0
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.2], fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[2, 3]}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
      >
        <SceneContent index={index} pointerRef={pointerRef} theme={cardTheme} imageSrc={imageSrc} />
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
