"use client"

import React, { useRef, useMemo, Suspense, useEffect } from "react"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { Float, useTexture, Billboard } from "@react-three/drei"
import * as THREE from "three"
import { OFFICIAL_LOGO } from "@/config/branding"

type Theme = "default" | "yellow" | "aurora"

interface SplashSceneProps {
  theme?: Theme
  className?: string
}

const themeColors = {
  default: {
    primary: "#ffffff",
    secondary: "#a0a0a0",
    accent: "#ffffff",
    particle: "#ffffff",
  },
  yellow: {
    primary: "#fbbf24",
    secondary: "#f59e0b",
    accent: "#fde047",
    particle: "#fcd34d",
  },
  aurora: {
    primary: "#00d4ff",
    secondary: "#7c3aed",
    accent: "#f59e0b",
    particle: "#a78bfa",
  },
}

// Shader para espirais com gradiente e glow translúcido
const spiralVertexShader = `
  varying vec2 vUv;
  varying float vProgress;
  void main() {
    vUv = uv;
    vProgress = uv.x;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const spiralFragmentShader = `
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vProgress;
  void main() {
    vec3 color = mix(uColorStart, uColorEnd, vProgress);
    color *= 0.9 + 0.1 * sin(vProgress * 10.0 + uTime * 2.0);
    float alpha = uOpacity * (0.3 + 0.4 * (1.0 - abs(vUv.y - 0.5) * 2.0));
    gl_FragColor = vec4(color, alpha);
  }
`

// Curva espiral orgânica (estilo nautilus)
class OrganicSpiralCurve extends THREE.Curve<THREE.Vector3> {
  radius: number
  height: number
  loops: number
  wobble: number
  offsetX: number
  offsetY: number

  constructor(
    radius = 2,
    height = 3,
    loops = 2,
    wobble = 0.3,
    offsetX = 0,
    offsetY = 0
  ) {
    super()
    this.radius = radius
    this.height = height
    this.loops = loops
    this.wobble = wobble
    this.offsetX = offsetX
    this.offsetY = offsetY
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.loops
    const r = this.radius * (1 + this.wobble * Math.sin(t * Math.PI * 4))
    const x = r * Math.cos(angle) + this.offsetX
    const y = (t - 0.5) * this.height + this.offsetY
    const z = r * Math.sin(angle)
    return optionalTarget.set(x, y, z)
  }
}

function SpiralRibbon({
  colorStart,
  colorEnd,
  tubeRadius,
  offsetX,
  offsetY,
  scale,
  mouseRef,
}: {
  colorStart: [number, number, number]
  colorEnd: [number, number, number]
  tubeRadius: number
  offsetX: number
  offsetY: number
  scale: number
  mouseRef: React.RefObject<{ x: number; y: number }>
}) {
  const curve = useMemo(() => {
    return new OrganicSpiralCurve(1.5 * scale, 2.5 * scale, 2.5, 0.25, offsetX, offsetY)
  }, [scale, offsetX, offsetY])

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, tubeRadius, 6, false)
  }, [curve, tubeRadius])

  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    const m = mouseRef.current
    if (meshRef.current && m) {
      meshRef.current.rotation.y += delta * 0.12
      meshRef.current.rotation.x = m.y * 0.35
      meshRef.current.rotation.z = m.x * 0.28
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={spiralVertexShader}
        fragmentShader={spiralFragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={{
          uColorStart: { value: new THREE.Vector3(...colorStart) },
          uColorEnd: { value: new THREE.Vector3(...colorEnd) },
          uTime: { value: 0 },
          uOpacity: { value: 0.5 },
        }}
      />
    </mesh>
  )
}

function AuroraSpirals({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null)

  const spiralConfigs = useMemo(
    () => [
      {
        colorStart: [0, 0.8, 1] as [number, number, number],
        colorEnd: [0.5, 0.2, 1] as [number, number, number],
        tubeRadius: 0.08,
        offsetX: 0.5,
        offsetY: 0.2,
        scale: 1,
      },
      {
        colorStart: [0.3, 0.9, 1] as [number, number, number],
        colorEnd: [1, 0.6, 0.2] as [number, number, number],
        tubeRadius: 0.06,
        offsetX: -0.3,
        offsetY: -0.3,
        scale: 1.2,
      },
      {
        colorStart: [0.6, 0.3, 1] as [number, number, number],
        colorEnd: [0.9, 0.2, 0.6] as [number, number, number],
        tubeRadius: 0.05,
        offsetX: 0.2,
        offsetY: 0.4,
        scale: 0.9,
      },
    ],
    []
  )

  return (
    <group ref={groupRef}>
      {spiralConfigs.map((config, i) => (
        <SpiralRibbon
          key={i}
          {...config}
          mouseRef={mouseRef}
        />
      ))}
    </group>
  )
}

// Logo AK dentro do plasma — parado, move para o lado oposto no clique
function AKLogoInsidePlasma({ logoPosRef, logoTargetRef }: {
  logoPosRef: React.RefObject<THREE.Vector3>
  logoTargetRef: React.RefObject<THREE.Vector3>
}) {
  const texture = useTexture(OFFICIAL_LOGO)
  const groupRef = useRef<THREE.Group>(null)

  const matProps = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    return {
      map: texture,
      alphaMap: texture,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    }
  }, [texture])

  useFrame((_, delta) => {
    if (!groupRef.current || !logoPosRef?.current || !logoTargetRef?.current) return
    // Suaviza o movimento em direção ao alvo
    const speed = 3 * delta
    logoPosRef.current.lerp(logoTargetRef.current, speed)
    groupRef.current.position.copy(logoPosRef.current)
  })

  return (
    <group ref={groupRef} position={[0, 0.2, 0.5]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh scale={[3, 3, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial {...matProps} />
        </mesh>
      </Billboard>
    </group>
  )
}

type RippleState = { origin: THREE.Vector3; worldOrigin: THREE.Vector3; startTime: number } | null

// Splash tipo coroneta — gotículas ao toque (shader-driven)
const splashVertexShader = `
  attribute vec3 aDirection;
  attribute float aSpeed;
  attribute float aSize;
  uniform vec3 uOrigin;
  uniform float uSplashTime;
  varying float vAlpha;
  void main() {
    if (uSplashTime > 1.3 || uSplashTime < 0.0) {
      gl_Position = vec4(0.0, 0.0, -10.0, 1.0);
      vAlpha = 0.0;
      return;
    }
    float t = clamp(uSplashTime, 0.0, 1.3);
    vec3 pos = uOrigin + aDirection * aSpeed * t + vec3(0.0, -2.5 * t * t, 0.0);
    vAlpha = 1.0 - smoothstep(0.8, 1.2, t);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (1.0 - t * 0.5) * 90.0;
  }
`

const splashFragmentShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.0, 1.0, d)) * vAlpha * 0.9;
    gl_FragColor = vec4(0.6, 0.92, 1.0, alpha);
  }
`

function TouchSplashParticles({ rippleRef }: { rippleRef: React.RefObject<RippleState> }) {
  const count = 70
  const { positions, directions, speeds, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const dirs = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(0.2 + Math.random() * 0.7)
      const theta = Math.random() * Math.PI * 2
      dirs[i * 3] = Math.sin(phi) * Math.cos(theta)
      dirs[i * 3 + 1] = Math.cos(phi)
      dirs[i * 3 + 2] = Math.sin(phi) * Math.sin(theta)
      spd[i] = 0.8 + Math.random() * 1.4
      sz[i] = 0.015 + Math.random() * 0.035
    }
    return { positions: pos, directions: dirs, speeds: spd, sizes: sz }
  }, [])

  const ref = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  // Cleanup para prevenir memory leaks
  useEffect(() => {
    return () => {
      if (matRef.current) {
        matRef.current.dispose()
      }
      if (ref.current && ref.current.geometry) {
        ref.current.geometry.dispose()
      }
    }
  }, [])

  useFrame((state) => {
    if (!matRef.current) return
    const r = rippleRef.current
    if (r && r.startTime) {
      const elapsed = state.clock.elapsedTime - r.startTime
      if (elapsed < 10) { // Prevenir valores extremos
        matRef.current.uniforms.uSplashTime.value = elapsed
        matRef.current.uniforms.uOrigin.value.copy(r.worldOrigin)
      } else {
        matRef.current.uniforms.uSplashTime.value = 10.0
      }
    } else {
      matRef.current.uniforms.uSplashTime.value = 10.0
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aDirection" args={[directions, 3]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={splashVertexShader}
        fragmentShader={splashFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{
          uOrigin: { value: new THREE.Vector3(0, 0, 0) },
          uSplashTime: { value: 10.0 },
        }}
      />
    </points>
  )
}

// Poeira cósmica brilhante — gradiente ciano/rosa
const cosmicDustVertexShader = `
  attribute float aPhase;
  attribute float aColorMix;
  attribute vec3 aDrift;
  attribute vec3 aOscDir;
  uniform float uTime;
  varying float vAlpha;
  varying float vColorMix;
  void main() {
    float drift = sin(uTime * 0.5 + aPhase) * 0.03;
    vec3 pos = position + aDrift * uTime * 0.25 + aOscDir * drift;
    vAlpha = 0.5 + 0.35 * sin(uTime + aPhase * 2.0);
    vColorMix = aColorMix;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 2.5;
  }
`

const cosmicDustFragmentShader = `
  varying float vAlpha;
  varying float vColorMix;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.0, 1.0, d)) * vAlpha;
    vec3 cyan = vec3(0.0, 0.9, 1.0);
    vec3 pink = vec3(1.0, 0.5, 0.95);
    vec3 color = mix(cyan, pink, vColorMix);
    gl_FragColor = vec4(color, alpha * 0.85);
  }
`

function CosmicDust({ mouseRef }: { mouseRef?: React.RefObject<{ x: number; y: number }> }) {
  const count = 320
  const { positions, oscDirs, phases, drifts, colorMix } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const oscDirs = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const drifts = new Float32Array(count * 3)
    const colorMix = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.4) * 12
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi) - 3
      oscDirs[i * 3] = (Math.random() - 0.5) * 2
      oscDirs[i * 3 + 1] = (Math.random() - 0.5) * 2
      oscDirs[i * 3 + 2] = (Math.random() - 0.5) * 2
      phases[i] = Math.random() * Math.PI * 2
      drifts[i * 3] = (Math.random() - 0.5) * 0.1
      drifts[i * 3 + 1] = (Math.random() - 0.5) * 0.1
      drifts[i * 3 + 2] = (Math.random() - 0.5) * 0.05
      colorMix[i] = Math.random()
    }
    return { positions, oscDirs, phases, drifts, colorMix }
  }, [])

  const ref = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    if (materialRef.current) materialRef.current.uniforms.uTime.value = timeRef.current
    if (ref.current && mouseRef?.current) {
      ref.current.rotation.y += delta * 0.03
      ref.current.rotation.x = mouseRef.current.y * 0.04
      ref.current.rotation.z = mouseRef.current.x * 0.03
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aOscDir" args={[oscDirs, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aDrift" args={[drifts, 3]} />
        <bufferAttribute attach="attributes-aColorMix" args={[colorMix, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={cosmicDustVertexShader}
        fragmentShader={cosmicDustFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 } }}
      />
    </points>
  )
}

function MouseTracker({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const { pointer } = useThree()
  const current = useRef({ x: 0, y: 0 })

  useFrame(() => {
    if (!mouseRef.current) return
    current.current.x += (pointer.x - current.current.x) * 0.12
    current.current.y += (pointer.y - current.current.y) * 0.12
    mouseRef.current.x = current.current.x
    mouseRef.current.y = current.current.y
  })

  return null
}

function CameraParallax({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const { camera } = useThree()
  const basePosition = useRef([0, 0, 5] as [number, number, number])

  useFrame(() => {
    const m = mouseRef.current
    if (!m) return
    const parallax = 0.4
    camera.position.x = basePosition.current[0] + m.x * parallax
    camera.position.y = basePosition.current[1] + m.y * parallax
    // lookAt atualiza apenas a matriz de visualização, não de projeção
    // updateProjectionMatrix() só é necessário ao mudar fov/near/far/aspect
    camera.lookAt(0, 0, 0)
  })

  return null
}

function CursorLight({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    const m = mouseRef.current
    if (!lightRef.current || !m) return
    const scale = 3
    lightRef.current.position.x = m.x * scale
    lightRef.current.position.y = m.y * scale
    lightRef.current.position.z = 2
  })

  return (
    <pointLight
      ref={lightRef}
      color="#00d4ff"
      intensity={0.8}
      distance={8}
      decay={2}
    />
  )
}

// Água 3D de excelente textura — shaders premium
const water3DVertexShader = `
  uniform float uTime;
  uniform vec3 uRippleOrigin;
  uniform float uRippleTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying float vDepth;
  
  // Noise procedural para ondulações orgânicas
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  float noise3d(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = i.x + i.y * 57.0 + i.z * 113.0;
    return mix(
      mix(mix(hash(n), hash(n+1.0), f.x), mix(hash(n+57.0), hash(n+58.0), f.x), f.y),
      mix(mix(hash(n+113.0), hash(n+114.0), f.x), mix(hash(n+170.0), hash(n+171.0), f.x), f.y),
      f.z
    );
  }
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    vec3 N = normalize(normalMatrix * normal);
    
    // Ondulações orgânicas multi-octave
    float n1 = noise3d(pos * 3.0 + uTime * 0.8) * 0.035;
    float n2 = noise3d(pos * 6.0 + uTime * 1.2) * 0.018;
    float n3 = sin(pos.x * 4.0 + uTime) * sin(pos.y * 4.0 + uTime * 0.7) * sin(pos.z * 4.0 + uTime * 0.5) * 0.02;
    float disp = n1 + n2 + n3;
    
    // Ripple no toque
    if (uRippleTime < 2.5) {
      float d = length(pos - uRippleOrigin);
      float wave = sin(d * 25.0 - uRippleTime * 18.0) * exp(-uRippleTime * 2.0);
      wave += sin(d * 40.0 - uRippleTime * 25.0) * 0.5 * exp(-uRippleTime * 2.2);
      float falloff = 1.0 - smoothstep(0.0, 1.2, d);
      disp += wave * falloff * 0.12 * (1.0 - uRippleTime * 0.4);
    }
    
    vec3 displaced = pos + N * disp;
    vPosition = displaced;
    vNormal = N;
    vDepth = (displaced.y + 1.0) * 0.5;
    
    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`

const water3DFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorShallow;
  uniform vec3 uColorHighlight;
  uniform vec3 uRippleOrigin;
  uniform float uRippleTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying float vDepth;
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 N = normalize(vNormal);
    float NdotV = abs(dot(N, viewDir));
    float fresnel = pow(1.0 - NdotV, 2.8);
    float thickness = 1.0 - NdotV;
    
    // Gradiente de profundidade (topo mais claro, base mais escura)
    vec3 deepColor = vec3(0.02, 0.12, 0.22);
    vec3 midColor = vec3(0.08, 0.35, 0.55);
    vec3 shallowColor = vec3(0.15, 0.65, 0.92);
    vec3 baseColor = mix(deepColor, midColor, vDepth);
    baseColor = mix(baseColor, shallowColor, 0.4 + thickness * 0.4);
    
    // Caustics animados (padrões de luz na água)
    float c1 = sin(vUv.x * 80.0 + uTime * 2.0) * sin(vUv.y * 80.0 + uTime * 1.6);
    float c2 = sin((vUv.x + vUv.y) * 60.0 + uTime * 1.5) * sin((vUv.x - vUv.y) * 45.0 - uTime * 1.2);
    float caustics = max(0.0, c1) * 0.08 + max(0.0, c2) * 0.06 + 0.86;
    baseColor *= caustics;
    
    // Brilho Fresnel (borda translúcida)
    vec3 highlight = vec3(0.6, 0.9, 1.0);
    vec3 color = mix(baseColor, highlight, fresnel * 0.85);
    
    // Anel de ripple no toque
    if (uRippleTime < 1.8) {
      float d = length(vPosition - uRippleOrigin);
      float ring = sin(d * 30.0 - uRippleTime * 20.0) * 0.5 + 0.5;
      ring *= exp(-uRippleTime * 1.8);
      color += vec3(0.25, 0.7, 1.0) * ring * 0.5;
    }
    
    // Transparência realista
    float alpha = mix(0.15, 0.82, fresnel);
    alpha *= 0.5 + thickness * 0.5;
    
    gl_FragColor = vec4(color, alpha);
  }
`

function Water3DSphere({ mouseRef, rippleRef, logoTargetRef }: {
  mouseRef?: React.RefObject<{ x: number; y: number }>
  rippleRef?: React.MutableRefObject<RippleState>
  logoTargetRef?: React.RefObject<THREE.Vector3>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state, delta) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    if (rippleRef?.current) {
      const elapsed = state.clock.elapsedTime - rippleRef.current.startTime
      matRef.current.uniforms.uRippleTime.value = elapsed
      matRef.current.uniforms.uRippleOrigin.value.copy(rippleRef.current.origin)
      if (elapsed > 2.5) rippleRef.current = null
    } else {
      matRef.current.uniforms.uRippleTime.value = 10.0
    }
    if (meshRef.current && mouseRef?.current) {
      meshRef.current.rotation.y += delta * 0.18
      meshRef.current.rotation.x = mouseRef.current.y * 0.1
      meshRef.current.rotation.z = mouseRef.current.x * 0.08
    }
  })

  useEffect(() => {
    return () => {
      if (matRef.current) matRef.current.dispose()
      if (meshRef.current?.geometry) meshRef.current.geometry.dispose()
    }
  }, [])

  const { clock } = useThree()
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const mesh = meshRef.current
    if (!mesh || !rippleRef) return
    const localPoint = e.point.clone().applyMatrix4(mesh.matrixWorld.clone().invert())
    rippleRef.current = {
      origin: localPoint,
      worldOrigin: e.point.clone(),
      startTime: clock.getElapsedTime(),
    }
    // Move o logo AK para o lado oposto do plasma
    if (logoTargetRef?.current) {
      const opposite = localPoint.clone().negate().normalize().multiplyScalar(0.5)
      logoTargetRef.current.copy(opposite)
    }
  }

  return (
    <mesh
      ref={meshRef}
      scale={[1.02, 1.2, 1.02]}
      onPointerDown={handlePointerDown}
      onPointerOver={() => document.body.style.cursor = "pointer"}
      onPointerOut={() => document.body.style.cursor = ""}
    >
      <sphereGeometry args={[1.1, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={water3DVertexShader}
        fragmentShader={water3DFragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={{
          uTime: { value: 0 },
          uColorDeep: { value: new THREE.Vector3(0.02, 0.15, 0.25) },
          uColorShallow: { value: new THREE.Vector3(0.12, 0.6, 0.9) },
          uColorHighlight: { value: new THREE.Vector3(0.6, 0.95, 1.0) },
          uRippleOrigin: { value: new THREE.Vector3(0, 0, 0) },
          uRippleTime: { value: 10.0 },
        }}
      />
    </mesh>
  )
}

// Animação 3D de água pingando e vazando do plasma
const dripVertexShader = `
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aStartPos;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    float t = mod(uTime * aSpeed + aPhase, 4.0);
    if (t > 3.2) {
      gl_Position = vec4(0.0, 0.0, -10.0, 1.0);
      vAlpha = 0.0;
      return;
    }
    float fall = t * 1.8;
    vec3 pos = aStartPos + vec3(0.0, -fall, 0.0);
    vAlpha = 1.0 - smoothstep(2.5, 3.2, t);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 12.0 * (1.0 - t * 0.15);
  }
`

const dripFragmentShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.0, 1.0, d)) * vAlpha * 0.9;
    gl_FragColor = vec4(0.4, 0.8, 1.0, alpha);
  }
`

// Filetes escorrendo pela superfície (efeito de vazamento)
const leakStreamVertexShader = `
  attribute float aPhase;
  attribute vec3 aBaseDir;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    float t = mod(uTime * 0.6 + aPhase, 3.0);
    if (t > 2.5) {
      gl_Position = vec4(0.0, 0.0, -10.0, 1.0);
      vAlpha = 0.0;
      return;
    }
    float flow = t * 0.5;
    vec3 pos = position + aBaseDir * flow;
    vAlpha = 0.5 * (1.0 - smoothstep(1.8, 2.5, t));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 6.0;
  }
`

const leakStreamFragmentShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = (1.0 - smoothstep(0.0, 1.0, d)) * vAlpha;
    gl_FragColor = vec4(0.3, 0.75, 0.95, alpha);
  }
`

function WaterLeakStreams() {
  const count = 60
  const { positions, phases, baseDirs } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const phs = new Float32Array(count)
    const dirs = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.PI * 0.55 + Math.random() * Math.PI * 0.5
      const phi = Math.random() * Math.PI * 2
      const r = 1.03
      pos[i * 3] = r * Math.sin(theta) * Math.cos(phi)
      pos[i * 3 + 1] = r * Math.cos(theta)
      pos[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi)
      phs[i] = Math.random() * 3
      dirs[i * 3] = 0.02 * (Math.random() - 0.5)
      dirs[i * 3 + 1] = -0.08 - Math.random() * 0.05
      dirs[i * 3 + 2] = 0.02 * (Math.random() - 0.5)
    }
    return { positions: pos, phases: phs, baseDirs: dirs }
  }, [])

  const matRef = useRef<THREE.ShaderMaterial>(null)
  useFrame((s) => { if (matRef.current) matRef.current.uniforms.uTime.value = s.clock.elapsedTime })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aBaseDir" args={[baseDirs, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={leakStreamVertexShader}
        fragmentShader={leakStreamFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 } }}
      />
    </points>
  )
}

function WaterDripLeak() {
  const count = 45
  const { positions, starts, phases, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const starts = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 0.8 + Math.PI * 0.35
      const phi = Math.random() * Math.PI * 2
      const r = 1.05
      starts[i * 3] = r * Math.sin(theta) * Math.cos(phi)
      starts[i * 3 + 1] = r * Math.cos(theta)
      starts[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi)
      phases[i] = Math.random() * 4
      speeds[i] = 0.4 + Math.random() * 0.5
    }
    return { positions: pos, starts, phases, speeds }
  }, [])

  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aStartPos" args={[starts, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={dripVertexShader}
        fragmentShader={dripFragmentShader}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 } }}
      />
    </points>
  )
}

function AuroraSceneContent() {
  const mouseRef = useRef({ x: 0, y: 0 })
  const rippleRef = useRef<RippleState>(null)
  const logoPosRef = useRef(new THREE.Vector3(0, 0.2, 0.5))
  const logoTargetRef = useRef(new THREE.Vector3(0, 0.2, 0.5))

  return (
    <>
      <MouseTracker mouseRef={mouseRef} />
      <CameraParallax mouseRef={mouseRef} />
      <ambientLight intensity={0.35} />
      <pointLight position={[-2, 3, 5]} intensity={1.5} color="#a0e8ff" />
      <pointLight position={[2, -2, 4]} intensity={0.8} color="#60c0e0" />
      <pointLight position={[0, 0, 4]} intensity={0.4} color="#ffffff" />
      <CursorLight mouseRef={mouseRef} />
      <CosmicDust mouseRef={mouseRef} />
      <AuroraSpirals mouseRef={mouseRef} />
      <Water3DSphere mouseRef={mouseRef} rippleRef={rippleRef} logoTargetRef={logoTargetRef} />
      <WaterDripLeak />
      <WaterLeakStreams />
      <TouchSplashParticles rippleRef={rippleRef} />
      <Float speed={0.4} rotationIntensity={0.1} floatIntensity={0.2}>
        <group>
          <AKLogoInsidePlasma logoPosRef={logoPosRef} logoTargetRef={logoTargetRef} />
        </group>
      </Float>
    </>
  )
}

function FloatingShapes({ theme }: { theme: Theme }) {
  const colors = themeColors[theme]
  const meshRef = useRef<THREE.Group>(null)
  const meshRef2 = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15
    }
    if (meshRef2.current) {
      meshRef2.current.rotation.x += delta * 0.2
      meshRef2.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group ref={meshRef}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={meshRef2}>
          <icosahedronGeometry args={[1.8, 1]} />
          <meshBasicMaterial
            color={colors.primary}
            wireframe
            transparent
            opacity={0.15}
          />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[2, -0.5, -1]}>
          <torusGeometry args={[1.2, 0.03, 16, 100]} />
          <meshBasicMaterial
            color={colors.secondary}
            transparent
            opacity={0.25}
          />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.4}>
        <mesh position={[-2, 0.5, -0.5]}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color={colors.accent}
            wireframe
            transparent
            opacity={0.1}
          />
        </mesh>
      </Float>
    </group>
  )
}

function ParticleField({ theme }: { theme: Theme }) {
  const count = 450
  const colors = themeColors[theme]
  const { positions } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return { positions }
  }, [count])

  const ref = useRef<THREE.Points>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={colors.particle}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function SceneContent({ theme }: { theme: Theme }) {
  if (theme === "aurora") {
    return <AuroraSceneContent />
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, 5]} intensity={0.3} />
      <ParticleField theme={theme} />
      <FloatingShapes theme={theme} />
    </>
  )
}

export function SplashScene({ theme = "default", className = "" }: SplashSceneProps) {
  const [hasError, setHasError] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Three.js rendering error:', event.error)
      setHasError(true)
    }
    const handleVisibility = () => setIsVisible(!document.hidden)

    window.addEventListener('error', handleError)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('error', handleError)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  if (hasError) {
    // Fallback simples sem Three.js se ocorrer erro
    return (
      <div className={`absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 ${className}`}>
        <div className="absolute inset-0 bg-black/20" />
      </div>
    )
  }

  return (
    <div
      className={`absolute inset-0 w-full h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_canvas]:!object-cover ${className}`}
      data-three-canvas
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 55 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 1]}
        performance={{ min: 0.5, max: 1 }}
        frameloop={isVisible ? "always" : "never"}
        onError={(error) => {
          console.error('Canvas error:', error)
          setHasError(true)
        }}
      >
        <Suspense fallback={null}>
          <SceneContent theme={theme} />
        </Suspense>
      </Canvas>
    </div>
  )
}
