"use client";

import Image from "next/image";
import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useState,
} from "react";

type DeviceNavigator = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

function HeroFallback({ priority = false }: { priority?: boolean }) {
  return (
    <div className="absolute inset-0 grid place-items-center" data-hero-fallback>
      <Image
        src="/images/3d/generic-ric-fallback-v1.webp"
        alt="Brand-neutral receiver-in-canal hearing device illustration"
        width={1254}
        height={1254}
        sizes="(max-width: 767px) 86vw, 43vw"
        className="h-[84%] w-[84%] object-contain drop-shadow-[0_34px_32px_rgba(5,31,45,0.3)]"
        priority={priority}
      />
    </div>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void error;
    void info;
    this.props.onFailure();
  }

  render() {
    if (this.state.failed) return <HeroFallback />;
    return this.props.children;
  }
}

function canUseEnhancedScene(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(pointer: coarse)").matches) return false;

  const device = navigator as DeviceNavigator;
  if (device.connection?.saveData) return false;
  if (["slow-2g", "2g"].includes(device.connection?.effectiveType ?? "")) return false;
  if (typeof device.deviceMemory === "number" && device.deviceMemory <= 4) return false;
  if (typeof device.hardwareConcurrency === "number" && device.hardwareConcurrency <= 4) return false;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HearingAidHero() {
  const [Scene, setScene] = useState<ComponentType | null>(null);
  const [checked, setChecked] = useState(false);
  const enhanced = Scene !== null;

  useEffect(() => {
    const allowScene = canUseEnhancedScene();
    setChecked(true);
    if (!allowScene) return;

    let active = true;
    void import("@/components/hearing-aid-scene")
      .then((module) => {
        if (active) setScene(() => module.default);
      })
      .catch(() => {
        if (active) setScene(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative isolate min-h-[25rem] overflow-hidden rounded-[1.75rem] border border-white/25 bg-[radial-gradient(circle_at_70%_20%,rgba(125,237,222,.34),transparent_34%),linear-gradient(145deg,#dff7f2,#90ccc6_48%,#376a76)] sm:min-h-[32rem]">
      <div aria-hidden="true" className="absolute inset-x-[12%] bottom-[7%] h-[16%] rounded-[50%] bg-slate-950/25 blur-2xl" />
      {checked && enhanced ? (
        <SceneBoundary onFailure={() => setScene(null)}>
          <Scene />
        </SceneBoundary>
      ) : (
        <HeroFallback priority />
      )}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 rounded-2xl border border-white/35 bg-white/75 px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
        <span>Generic educational visualization</span>
        <span className="rounded-full bg-teal-950 px-3 py-1 text-white">
          {checked && enhanced ? "Lightweight 3D" : "Optimized still"}
        </span>
      </div>
    </div>
  );
}
