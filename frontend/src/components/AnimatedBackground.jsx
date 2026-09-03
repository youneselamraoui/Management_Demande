import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

// Fond animé fixe, placé derrière tout le contenu de l'app.
// pointer-events: none => n'intercepte jamais les clics.
export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <ShaderGradientCanvas
        style={{ position: 'absolute', inset: 0, opacity: 0.35 }}
        pixelDensity={1}
        fov={45}
      >
        <ShaderGradient
          animate="on"
          type="waterPlane"
          shader="defaults"
          cAzimuthAngle={180}
          cPolarAngle={120}
          cDistance={2.91}
          cameraZoom={1}
          lightType="3d"
          envPreset="city"
          brightness={1}
          reflection={0.1}
          // couleurs alignées sur ta palette navy / blue-fg
          color1="#123A5E"
          color2="#175CA6"
          color3="#E1EFFC"
          positionX={0}
          positionY={1.8}
          positionZ={0}
          rotationX={0}
          rotationY={0}
          rotationZ={-90}
          uTime={0.2}
          uSpeed={0.15}
          uStrength={2}
          uDensity={1}
          uFrequency={5.5}
          uAmplitude={0}
          grain="off"
          wireframe={false}
          range="disabled"
          rangeStart={0}
          rangeEnd={40}
        />
      </ShaderGradientCanvas>
    </div>
  )
}