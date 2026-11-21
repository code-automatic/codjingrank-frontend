"use client";

import { useEffect, useRef } from "react";
import styles from "./AuthTransition.module.css";

const vertex = `attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `
precision highp float;
varying vec2 uv;
uniform float time;
uniform float opening;
uniform float aspect;
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=noise(p)*a;p=mat2(.8,.6,-.6,.8)*p*2.04+2.7;a*=.5;}return v;}
void main(){
 vec2 p=(uv-.5)*vec2(aspect,1.);
 vec2 axis=normalize(vec2(aspect,.78));
 vec2 normal=vec2(-axis.y,axis.x);
 float along=dot(p,axis),distance=dot(p,normal);
 vec2 drift=vec2(time*.14,-time*.09);
 vec2 warp=vec2(fbm(p*3.+drift),fbm(p*3.1-drift+6.));
 float cloud=fbm(p*5.0+warp*3.0+drift);
 float detail=fbm(p*13.-drift*2.+warp);
 float folds=smoothstep(.28,.78,cloud)*(.35+detail);
 float vignette=1.-smoothstep(.2,1.3,length(p/vec2(aspect,1.)));
 vec3 smoke=vec3(.075,.09,.105)+vec3(.29,.34,.39)*folds*(.35+vignette*.65);
 smoke*=.38+.62*vignette;
 float jagged=(fbm(vec2(along*15.,time*.35))*2.-1.)*.065;
 float width=pow(clamp(opening,0.,1.),1.7)*(aspect+1.);
 float edge=abs(distance+jagged)-width;
 float fog=exp(-abs(edge)*13.)*smoothstep(.15,.7,cloud);
 float flare=exp(-abs(edge)*95.);
 float core=exp(-abs(edge)*420.);
 float sweep=smoothstep(-1.,1.,time*5.-along*1.4-1.2);
 float build=smoothstep(.03,.23,time);
 vec3 energy=vec3(.12,.65,.88)*(flare*.9+fog*.7)+vec3(.72,.98,1.)*core*1.7;
 float sparks=pow(max(0.,detail-.49)*5.,4.)*exp(-abs(edge)*17.);
 vec3 color=smoke+energy*sweep*build+vec3(.4,.85,1.)*sparks*build;
 float alpha=smoothstep(-.015,.015,edge);
 if(opening<.001)alpha=1.;
 float haze=exp(-abs(edge)*24.)*.30*(1.-alpha)*build;
 alpha=max(alpha,haze);
 color=mix(color,vec3(.16,.55,.68),haze);
 gl_FragColor=vec4(color,alpha);
}`;

export function SlashAtmosphere({
  phase,
}: {
  phase: "idle" | "cover" | "opening";
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const openingAt = useRef<number | null>(null);
  const started = useRef(0);
  const playback = useRef<(active: boolean) => void>(() => {});
  useEffect(() => {
    if (phase === "cover") {
      started.current = performance.now();
      openingAt.current = null;
    }
    if (phase === "opening")
      openingAt.current = Math.max(performance.now(), started.current + 300);
    playback.current(phase !== "idle");
  }, [phase]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const gl = element.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const shaders: WebGLShader[] = [];
    const clean = () => {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      shaders.forEach((shader) => gl.deleteShader(shader));
    };
    if (!program || !buffer) {
      clean();
      return;
    }
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) {
        clean();
        return;
      }
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        clean();
        return;
      }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      clean();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const clock = gl.getUniformLocation(program, "time"),
      reveal = gl.getUniformLocation(program, "opening"),
      aspect = gl.getUniformLocation(program, "aspect");
    const resize = () => {
      const scale = Math.min(0.85, 1100 / window.innerWidth);
      element.width = Math.round(window.innerWidth * scale);
      element.height = Math.round(window.innerHeight * scale);
      gl.viewport(0, 0, element.width, element.height);
      gl.uniform1f(aspect, window.innerWidth / window.innerHeight);
    };
    resize();
    started.current = performance.now();
    let frame = 0,
      last = 0;
    const tick = (now: number) => {
      if (now - last >= 30) {
        last = now;
        gl.uniform1f(clock, (now - started.current) / 1000);
        gl.uniform1f(
          reveal,
          openingAt.current === null
            ? 0
            : Math.max(0, (now - openingAt.current) / 1100),
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (element.dataset.slashReady !== "true")
          element.dataset.slashReady = "true";
      }
      frame = requestAnimationFrame(tick);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      delete element.dataset.slashReady;
      cancelAnimationFrame(frame);
    };
    playback.current = (active) => {
      if (!active) {
        cancelAnimationFrame(frame);
        frame = 0;
        delete element.dataset.slashReady;
      } else if (!frame && !gl.isContextLost()) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    gl.uniform1f(clock, 0);
    gl.uniform1f(reveal, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.addEventListener("resize", resize);
    element.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      playback.current = () => {};
      window.removeEventListener("resize", resize);
      element.removeEventListener("webglcontextlost", lost);
      clean();
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className={styles.atmosphere}
      data-slash-atmosphere
      aria-hidden="true"
    />
  );
}
