import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Component,
  Suspense,
  type ReactNode,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

type CharacterProps = {
  characterRef: RefObject<THREE.Group | null>;
  onReady: () => void;
};

type ModelLayerProps = {
  groupRef?: RefObject<THREE.Group | null>;
  initialOpacity: number;
  onFirstRender: () => void;
  url: string;
};

const PREVIEW_MODEL_URL = "/threejsobjects/person/person-preview.glb";
const DETAILED_MODEL_URL = "/threejsobjects/person/person-detailed.glb";
const ORIGINAL_MODEL_URL = "/threejsobjects/person/model.glb";
const MODEL_HEIGHT = 4.4;
const CROSSFADE_SECONDS = 0.4;

const setModelOpacity = (model: THREE.Object3D | null, opacity: number) => {
  if (!model) return;

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];

    materials.forEach((material) => {
      const baseOpacity = Number(material.userData.progressiveBaseOpacity ?? material.opacity);
      const baseTransparent = Boolean(
        material.userData.progressiveBaseTransparent ?? material.transparent,
      );
      const baseDepthWrite = Boolean(
        material.userData.progressiveBaseDepthWrite ?? material.depthWrite,
      );

      material.userData.progressiveBaseOpacity = baseOpacity;
      material.userData.progressiveBaseTransparent = baseTransparent;
      material.userData.progressiveBaseDepthWrite = baseDepthWrite;
      material.opacity = baseOpacity * opacity;
      material.transparent = baseTransparent || opacity < 1;
      material.depthWrite = opacity >= 1 ? baseDepthWrite : false;
    });
  });
};

const ModelLayer = ({
  groupRef,
  initialOpacity,
  onFirstRender,
  url,
}: ModelLayerProps) => {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const modelClone = clone(scene);

    modelClone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone();
    });

    return modelClone;
  }, [scene]);

  const fit = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = size.y > 0 ? MODEL_HEIGHT / size.y : 1;

    return {
      scale,
      offset: [-center.x, -bounds.min.y, -center.z] as [number, number, number],
    };
  }, [model]);

  useLayoutEffect(() => {
    setModelOpacity(model, initialOpacity);

    return () => {
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [initialOpacity, model]);

  useLayoutEffect(() => {
    let frame: number | null = null;
    let hasRendered = false;
    const restoreCallbacks: Array<() => void> = [];

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const previous = child.onAfterRender;
      child.onAfterRender = function (...args) {
        previous.apply(this, args);
        if (hasRendered) return;
        hasRendered = true;
        frame = requestAnimationFrame(onFirstRender);
      };
      restoreCallbacks.push(() => {
        child.onAfterRender = previous;
      });
    });

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      restoreCallbacks.forEach((restore) => restore());
    };
  }, [model, onFirstRender]);

  return (
    <group ref={groupRef} dispose={null}>
      <group scale={fit.scale}>
        <group position={fit.offset}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
};

class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const ProgressiveCharacter = ({ onReady }: Pick<CharacterProps, "onReady">) => {
  const previewRef = useRef<THREE.Group>(null);
  const detailedRef = useRef<THREE.Group>(null);
  const transition = useRef(0);
  const readySent = useRef(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [detailedReady, setDetailedReady] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const handlePreviewReady = useCallback(() => {
    if (!readySent.current) {
      readySent.current = true;
      onReady();
    }
    setPreviewReady(true);
  }, [onReady]);

  const handleDetailedReady = useCallback(() => {
    setDetailedReady(true);
  }, []);

  useFrame((_, delta) => {
    if (!detailedReady || !detailedRef.current) return;

    transition.current = Math.min(1, transition.current + delta / CROSSFADE_SECONDS);
    const opacity = THREE.MathUtils.smoothstep(transition.current, 0, 1);
    setModelOpacity(previewRef.current, 1 - opacity);
    setModelOpacity(detailedRef.current, opacity);

    if (transition.current === 1 && showPreview) setShowPreview(false);
  });

  const originalFallback = (
    <Suspense fallback={null}>
      <ModelLayer
        initialOpacity={1}
        onFirstRender={handlePreviewReady}
        url={ORIGINAL_MODEL_URL}
      />
    </Suspense>
  );

  return (
    <>
      {showPreview && (
        <ModelErrorBoundary fallback={originalFallback}>
          <Suspense fallback={null}>
            <ModelLayer
              groupRef={previewRef}
              initialOpacity={1}
              onFirstRender={handlePreviewReady}
              url={PREVIEW_MODEL_URL}
            />
          </Suspense>
        </ModelErrorBoundary>
      )}

      {previewReady && (
        <ModelErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <ModelLayer
              groupRef={detailedRef}
              initialOpacity={0}
              onFirstRender={handleDetailedReady}
              url={DETAILED_MODEL_URL}
            />
          </Suspense>
        </ModelErrorBoundary>
      )}
    </>
  );
};

export const Character = ({ characterRef, onReady }: CharacterProps) => (
  <group ref={characterRef} position={[0.75, -1.84, 0]} dispose={null}>
    <ProgressiveCharacter onReady={onReady} />
  </group>
);

useGLTF.preload(PREVIEW_MODEL_URL);
