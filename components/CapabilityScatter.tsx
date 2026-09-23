'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type ScatterPoint = {
  name: string;
  lab: string;
  price: number; // USD per million input tokens
  context: number; // input tokens
  released: string;
  accent: string;
};

/**
 * The price/context frontier in WebGL.
 *
 * x = input price, y = context window, z = release date. Depth is the point:
 * on a flat chart the two axes hide when each model arrived, and the whole
 * story of this field is that the frontier moves down and to the right over
 * time. Rotating it slowly makes that visible.
 *
 * The third axis is benchmark score, not context, once coverage supports it —
 * see the note this renders beneath itself. Plotting a score axis from four
 * sourced results would be a chart of nothing.
 *
 * Falls back to a plain SVG for reduced-motion and for anyone without WebGL.
 */
export default function CapabilityScatter({ points }: { points: ScatterPoint[] }) {
  const mount = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const el = mount.current;
    if (!el || points.length === 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFallback(true);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFallback(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(3.1, 2.2, 3.4);
    camera.lookAt(0, 0.2, 0);

    const size = () => {
      const w = el.clientWidth;
      const h = Math.max(320, Math.min(w * 0.6, 520));
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    size();

    const group = new THREE.Group();
    scene.add(group);

    // Normalise each axis independently; absolute units mean nothing in 3D space.
    const prices = points.map((p) => p.price);
    const ctxs = points.map((p) => Math.log10(p.context));
    const times = points.map((p) => new Date(p.released).getTime());
    const norm = (v: number, arr: number[]) => {
      const lo = Math.min(...arr);
      const hi = Math.max(...arr);
      return hi === lo ? 0.5 : (v - lo) / (hi - lo);
    };

    const geo = new THREE.SphereGeometry(0.055, 18, 18);
    points.forEach((p) => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.accent) });
      const dot = new THREE.Mesh(geo, mat);
      dot.position.set(
        (norm(p.price, prices) - 0.5) * 2.4,
        (norm(Math.log10(p.context), ctxs) - 0.5) * 1.8,
        (norm(new Date(p.released).getTime(), times) - 0.5) * 2.4,
      );
      group.add(dot);
    });

    // Floor grid, so the depth axis reads as depth.
    const grid = new THREE.GridHelper(3, 8, 0x888888, 0x888888);
    (grid.material as THREE.Material).opacity = 0.14;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = -1;
    scene.add(grid);

    let frame = 0;
    const animate = () => {
      group.rotation.y += 0.0022;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    const ro = new ResizeObserver(size);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      geo.dispose();
      group.children.forEach((c) => {
        if (c instanceof THREE.Mesh) (c.material as THREE.Material).dispose();
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <p className="bench-empty">
        No model currently has both a sourced price and a sourced context window. The
        chart appears when one does.
      </p>
    );
  }

  if (fallback) {
    const maxP = Math.max(...points.map((p) => p.price));
    const maxC = Math.max(...points.map((p) => Math.log10(p.context)));
    const minC = Math.min(...points.map((p) => Math.log10(p.context)));
    return (
      <svg className="scatter-flat" viewBox="0 0 400 260" role="img"
        aria-label="Input price against context window for every model with both figures sourced.">
        <line x1="40" y1="220" x2="380" y2="220" stroke="currentColor" strokeOpacity="0.25" />
        <line x1="40" y1="20" x2="40" y2="220" stroke="currentColor" strokeOpacity="0.25" />
        {points.map((p) => (
          <circle
            key={p.name}
            cx={40 + (p.price / maxP) * 330}
            cy={220 - ((Math.log10(p.context) - minC) / Math.max(maxC - minC, 0.001)) * 190}
            r="5"
            fill={p.accent}
          >
            <title>{`${p.name} — $${p.price}/Mtok in, ${p.context.toLocaleString()} ctx`}</title>
          </circle>
        ))}
      </svg>
    );
  }

  return <div className="scatter" ref={mount} />;
}
