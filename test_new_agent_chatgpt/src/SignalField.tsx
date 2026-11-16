import { useEffect, useRef } from "react";
export default function SignalField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      width = 0,
      height = 0;
    let active = true;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = motion.matches ? 0 : time * 0.00025;
      for (let row = 0; row < 20; row++) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 3) {
          const p = x / width;
          const separation = Math.pow(Math.abs(p - 0.55) * 1.7, 1.9);
          const ripple =
            Math.sin(p * 15 + t + row * 0.16) * 22 + Math.sin(p * 27 - t) * 7;
          const y =
            height / 2 +
            (row - 9.5) * 12 * separation +
            ripple * (1 - separation * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(188,25,59,${0.12 + (1 - Math.abs(row - 9.5) / 10) * 0.45})`;
        ctx.lineWidth = row === 10 ? 1.8 : 0.8;
        ctx.stroke();
      }
      if (active && !motion.matches) frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(() => {
      resize();
      if (motion.matches || !active) draw(0);
    });
    observer.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (active) frame = requestAnimationFrame(draw);
    });
    visibility.observe(canvas);
    const change = () => {
      cancelAnimationFrame(frame);
      draw(0);
    };
    motion.addEventListener("change", change);
    resize();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      motion.removeEventListener("change", change);
    };
  }, []);
  return <canvas ref={ref} className="signal-canvas" aria-hidden="true" />;
}
