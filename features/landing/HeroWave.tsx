"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./hero-wave.module.css";

const WAVE_SPEED = 1.8;

const vertexSource = `
attribute vec2 aPosition;
uniform float uTime;
uniform vec2 uPointer;
uniform float uStrength;
varying vec3 vNormal;
varying vec2 vUv;
float heightAt(vec2 p) {
  float h = sin(p.x * 4.2 + p.y * 2.7 + uTime * .38) * .21;
  h += sin(p.y * 6.0 - p.x * 2.1 - uTime * .27) * .12;
  h += cos(p.x * 7.2 + p.y * 3.6 + uTime * .18) * .04;
  vec2 d = p - uPointer;
  h += exp(-dot(d,d) * 4.0) * (.055 + sin(length(d) * 8.0 - uTime * .9) * .018) * uStrength;
  return h;
}
void main() {
  vec2 p = aPosition;
  float h = heightAt(p);
  float dx = (heightAt(p + vec2(.006,0.0)) - heightAt(p - vec2(.006,0.0))) / .012;
  float dy = (heightAt(p + vec2(0.0,.006)) - heightAt(p - vec2(0.0,.006))) / .012;
  vNormal = normalize(vec3(-dx * .72,-dy * .72,1.0));
  vUv = p;
  float depth = 1.0 + p.y * .12;
  gl_Position = vec4(p.x / depth, (p.y + h * .28) / depth, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
uniform float uTime;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vec3 n = normalize(vNormal);
  vec3 lamp = normalize(vec3(-.65 + sin(uTime * .12) * .08,.8 + cos(uTime * .1) * .06,1.25));
  float light = max(dot(n, lamp),0.0);
  float sheen = pow(max(dot(reflect(-lamp,n),vec3(0.0,0.0,1.0)),0.0),12.0);
  vec3 mint = mix(vec3(.65,.84,.78),vec3(.92,.96,.88),smoothstep(-1.0,1.0,vUv.x));
  vec3 color = mint * (.76 + light * .28) + vec3(.82,.96,.90) * sheen * .055;
  float center = exp(-pow(vUv.x * 1.65,2.0) - pow((vUv.y + .06) * 2.1,2.0));
  color = mix(color,vec3(.985,.992,.975),center * .96);
  float bottom = smoothstep(.25,1.0,-vUv.y);
  color = mix(color,vec3(1.0),bottom * .97);
  gl_FragColor = vec4(color,1.0);
}`;

export function HeroWave() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = canvas.current;
    const surface = element?.closest("section");
    if (!element || !surface) return;
    const gl = element.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    if (!program || !buffer) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return false;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return false;
      gl.attachShader(program, shader);
      return true;
    };
    const dispose = () => {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
    };
    if (
      !compile(gl.VERTEX_SHADER, vertexSource) ||
      !compile(gl.FRAGMENT_SHADER, fragmentSource)
    ) {
      dispose();
      return;
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dispose();
      return;
    }
    gl.useProgram(program);
    const columns = window.innerWidth < 700 ? 80 : 140;
    const rows = 80;
    const vertices: number[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const left = (x / columns) * 2.8 - 1.4;
        const right = ((x + 1) / columns) * 2.8 - 1.4;
        const bottom = (y / rows) * 2.8 - 1.4;
        const top = ((y + 1) / rows) * 2.8 - 1.4;
        vertices.push(
          left,
          bottom,
          right,
          bottom,
          left,
          top,
          left,
          top,
          right,
          bottom,
          right,
          top,
        );
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const timeUniform = gl.getUniformLocation(program, "uTime");
    const pointerUniform = gl.getUniformLocation(program, "uPointer");
    const strengthUniform = gl.getUniformLocation(program, "uStrength");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let visible = true;
    let previous = 0;
    let time = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let strength = 0;
    let targetStrength = 0;
    let lost = false;
    const draw = () => {
      gl.uniform1f(timeUniform, time);
      gl.uniform2f(pointerUniform, x, y);
      gl.uniform1f(strengthUniform, strength);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    };
    const allowed = () =>
      visible && !document.hidden && !motion.matches && !lost;
    const tick = (now: number) => {
      frame = 0;
      if (!allowed()) return;
      const delta = now - previous;
      if (delta >= 32) {
        time += (Math.min(delta, 64) / 1000) * WAVE_SPEED;
        previous = now;
        x += (targetX - x) * 0.09;
        y += (targetY - y) * 0.09;
        strength += (targetStrength - strength) * 0.08;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = performance.now();
      if (allowed()) frame = requestAnimationFrame(tick);
      else if (!lost) draw();
    };
    const resize = () => {
      const bounds = surface.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      element.width = Math.round(bounds.width * ratio);
      element.height = Math.round(bounds.height * ratio);
      gl.viewport(0, 0, element.width, element.height);
      draw();
    };
    const move = (event: PointerEvent) => {
      if (!fine.matches || motion.matches || event.pointerType !== "mouse")
        return;
      const bounds = surface.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      targetY = 1 - ((event.clientY - bounds.top) / bounds.height) * 2;
      targetStrength = 1;
    };
    const leave = () => {
      targetStrength = 0;
      targetX = targetY = 0;
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      setReady(false);
      cancelAnimationFrame(frame);
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      sync();
    });
    const resizer = new ResizeObserver(resize);
    observer.observe(surface);
    resizer.observe(surface);
    surface.addEventListener("pointermove", move, { passive: true });
    surface.addEventListener("pointerleave", leave);
    element.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    resize();
    setReady(true);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", leave);
      element.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      dispose();
    };
  }, []);

  return (
    <>
      <div className={styles.surface} aria-hidden="true" data-ready={ready}>
        <svg
          className={styles.fallback}
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-fill" x2="0.8" y2="1">
              <stop stopColor="#b3ded2" />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-fill)"
            d="M0 0H1440V430C1150 160 1050 610 740 390S220 100 0 420Z"
          />
          <path
            fill="none"
            stroke="#85bdb0"
            strokeOpacity=".22"
            strokeWidth="2"
            d="M-40 300C240 0 440 580 760 330S1200 180 1500 400"
          />
        </svg>
        <canvas ref={canvas} className={styles.canvas} />
      </div>
    </>
  );
}
