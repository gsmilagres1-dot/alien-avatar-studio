import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Loader2, X, Download, RotateCcw, Box } from "lucide-react";
import { generateAvatarSTL, downloadAvatarSTL } from "@/lib/stl-export";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  filenameBase: string;
  widthMm?: number;
};

export function STLPreviewModal({ open, onClose, imageUrl, filenameBase, widthMm = 80 }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sizeKB, setSizeKB] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    setLoading(true);
    setError(null);
    setSizeKB(null);

    // Scene setup
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, -120, 90);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0x8affff, 1.1);
    key.position.set(60, -80, 100);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xff66cc, 0.6);
    fill.position.set(-80, 60, 40);
    scene.add(fill);

    let mesh: THREE.Mesh | null = null;
    let animId = 0;

    (async () => {
      try {
        const blob = await generateAvatarSTL(imageUrl, { widthMm });
        if (disposed) return;
        setSizeKB(blob.size / 1024);
        const buf = await blob.arrayBuffer();
        const loader = new STLLoader();
        const geo = loader.parse(buf);
        geo.computeVertexNormals();
        geo.center();

        const mat = new THREE.MeshStandardMaterial({
          color: 0xe6e6f0,
          metalness: 0.15,
          roughness: 0.55,
        });
        mesh = new THREE.Mesh(geo, mat);
        // Deitar peça: o heightmap sai no plano XY com Z para cima; giramos para ficar de frente para a câmera.
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        // Enquadrar
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const dist = maxDim * 2.2;
        camera.position.set(0, -dist, dist * 0.55);
        controls.target.set(0, 0, 0);
        controls.update();

        setLoading(false);
      } catch (e) {
        if (!disposed) {
          setError((e as Error).message);
          setLoading(false);
        }
      }
    })();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [open, imageUrl, widthMm]);

  if (!open) return null;

  async function handleDownload() {
    setDownloading(true);
    try {
      const s = await downloadAvatarSTL(imageUrl, filenameBase, { widthMm });
      toast.success(`Molde 3D salvo (${(s / 1024).toFixed(0)} KB) — Bambu · Flashforge · Creality.`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="glass rounded-2xl w-full max-w-lg overflow-hidden border border-accent/30 shadow-neon">
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-accent" />
            <h2 className="font-display text-sm text-gradient-neon">Prévia do molde 3D</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative bg-[#0a0a1a]">
          <div ref={mountRef} className="w-full aspect-square" />
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-accent">
              <Loader2 className="w-6 h-6 animate-spin" />
              Gerando prévia 3D...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground bg-black/50 rounded-lg px-2 py-1 backdrop-blur">
              <span className="inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Arraste para girar · role para zoom</span>
              {sizeKB !== null && <span>{sizeKB.toFixed(0)} KB</span>}
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Litofânia do avatar em {widthMm}mm. Compatível com Bambu Studio, FlashPrint (Flashforge) e Creality Print / Cura.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full glass text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !!error || downloading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-alien-grad text-primary-foreground text-xs font-bold shadow-neon disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Baixar .stl
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
