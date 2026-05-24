import { useRef, useEffect } from 'react';
import { Activity, Droplets, Wind, Thermometer } from 'lucide-react';

// ─── Lerp utility ──────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

// ─── 1. AQI Particle Field — Brownian motion particle system ───────────────
export const AQIParticleField = ({ aqi = 1, onClick }) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const stateRef     = useRef({ targetAqi: aqi, currentAqi: aqi, particles: [], t: 0 });

  useEffect(() => { stateRef.current.targetAqi = aqi; }, [aqi]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const AQI_COLORS = ['', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#a855f7'];

    const initParticles = (W, H, count) => {
      stateRef.current.particles = Array.from({ length: count }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        vx:    (Math.random() - 0.5) * 1.2,
        vy:    (Math.random() - 0.5) * 1.2,
        r:     Math.random() * 2.2 + 0.6,
        alpha: Math.random() * 0.55 + 0.2,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const handleResize = () => {
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      const count = 25 + Math.round((stateRef.current.currentAqi - 1) * 38);
      initParticles(canvas.width, canvas.height, count);
    };
    handleResize();

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let animId;
    const loop = () => {
      const s   = stateRef.current;
      s.currentAqi = lerp(s.currentAqi, s.targetAqi, 0.025); // smooth transition
      s.t += 0.018;

      const W   = canvas.width;
      const H   = canvas.height;
      const ctx = canvas.getContext('2d');
      const aqi = s.currentAqi;
      const color = AQI_COLORS[Math.round(aqi)] ?? '#10b981';
      const maxSpeed = 2.8 - (aqi - 1) * 0.42; // fast=good, slow=bad

      ctx.clearRect(0, 0, W, H);

      s.particles.forEach(p => {
        // Brownian random walk
        p.vx += (Math.random() - 0.5) * 0.18;
        p.vy += (Math.random() - 0.5) * 0.18;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > maxSpeed) { p.vx = (p.vx / spd) * maxSpeed; p.vy = (p.vy / spd) * maxSpeed; }

        p.x += p.vx; p.y += p.vy;
        if (p.x < -6) p.x = W + 6; if (p.x > W + 6) p.x = -6;
        if (p.y < -6) p.y = H + 6; if (p.y > H + 6) p.y = -6;

        const breathe = 0.65 + Math.sin(s.t * 1.4 + p.phase) * 0.35;

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha * breathe;
        ctx.fill();

        // Glow halo
        if (p.r > 1.6) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
          g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00');
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.globalAlpha = p.alpha * breathe * 0.6; ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(animId); };
  }, []);

  const color  = ['', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#a855f7'][aqi] ?? '#10b981';
  const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

  return (
    <div ref={containerRef} onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{ background: 'rgba(9,13,22,0.85)', border: `1px solid ${color}28`, height: 160,
               transition: 'border-color 600ms ease, transform 200ms ease' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.015)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      {/* subtle vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(9,13,22,0.6) 100%)' }} />
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Air Quality</span>
        </div>
        <div>
          <div className="flex items-end gap-1.5">
            <span className="font-extrabold leading-none" style={{ fontSize: 42, color }}>{aqi}</span>
            <span className="text-sm font-bold text-white/30 mb-1">/5</span>
          </div>
          <p className="text-xs font-semibold text-white/50 mt-0.5">{labels[aqi] ?? '—'}</p>
        </div>
      </div>
      <span className="absolute top-3 right-3 text-[9px] text-white/15 group-hover:text-white/35 transition-all duration-300 pointer-events-none">tap ↑</span>
    </div>
  );
};

// ─── 2. Humidity Wave — multi-layer sine wave sloshing ─────────────────────
export const HumidityWave = ({ humidity = 60, onClick }) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const stateRef     = useRef({ targetHumidity: humidity, currentHumidity: humidity, t: 0 });

  useEffect(() => { stateRef.current.targetHumidity = humidity; }, [humidity]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => { canvas.width = container.clientWidth; canvas.height = container.clientHeight; };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let animId;
    const loop = () => {
      const s = stateRef.current;
      s.currentHumidity = lerp(s.currentHumidity, s.targetHumidity, 0.03);
      s.t += 0.022;

      const W   = canvas.width;
      const H   = canvas.height;
      const h   = s.currentHumidity;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, W, H);

      const amplitude = (h / 100) * H * 0.28 + 4;
      const baseY     = H * 0.68;
      const freq      = 0.011 + (h / 100) * 0.009;
      const speed     = 0.028 + (h / 100) * 0.042;

      // 3 layered waves (organic liquid-slosh effect)
      [
        { phase: 0,             alpha: 0.55, ampMul: 1.00, freqMul: 1.00 },
        { phase: Math.PI * 0.6, alpha: 0.30, ampMul: 0.70, freqMul: 1.30 },
        { phase: Math.PI * 1.2, alpha: 0.18, ampMul: 0.45, freqMul: 0.75 },
      ].forEach(({ phase, alpha, ampMul, freqMul }) => {
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
          const y = baseY
            + Math.sin(x * freq * freqMul + s.t * speed + phase) * amplitude * ampMul
            + Math.sin(x * freq * 1.7 * freqMul + s.t * speed * 0.75 + phase + 1) * amplitude * 0.28 * ampMul;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath();

        const gr = ctx.createLinearGradient(0, baseY - amplitude, 0, H);
        gr.addColorStop(0,   `rgba(56, 189, 248, ${alpha})`);
        gr.addColorStop(0.5, `rgba(14, 165, 233, ${alpha * 0.55})`);
        gr.addColorStop(1,   `rgba(2, 132, 199, 0)`);
        ctx.fillStyle = gr;
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(animId); };
  }, []);

  const status = humidity < 30 ? 'Dry' : humidity < 60 ? 'Comfortable' : humidity < 80 ? 'Humid' : 'Very Humid';

  return (
    <div ref={containerRef} onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{ background: 'rgba(9,13,22,0.85)', border: '1px solid rgba(56,189,248,0.15)', height: 160,
               transition: 'transform 200ms ease' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.015)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Humidity</span>
        </div>
        <div>
          <div className="flex items-end gap-1">
            <span className="font-extrabold leading-none text-sky-400" style={{ fontSize: 42 }}>{Math.round(humidity)}</span>
            <span className="text-xl font-bold text-sky-400/50 mb-1">%</span>
          </div>
          <p className="text-xs font-semibold text-white/40 mt-0.5">{status}</p>
        </div>
      </div>
      <span className="absolute top-3 right-3 text-[9px] text-white/15 group-hover:text-white/35 transition-all duration-300 pointer-events-none">tap ↑</span>
    </div>
  );
};

// ─── 3. Wind Streamlines — vector particle flow ────────────────────────────
export const WindStreamlines = ({ speed = 3, direction = 270, onClick }) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const stateRef     = useRef({ targetSpeed: speed, currentSpeed: speed, direction, particles: [] });

  useEffect(() => { stateRef.current.targetSpeed = speed; stateRef.current.direction = direction; }, [speed, direction]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const initParticles = (W, H) => {
      stateRef.current.particles = Array.from({ length: 60 }, () => ({
        x:    Math.random() * W,
        y:    Math.random() * H,
        life: Math.random(),
        spd:  0.4 + Math.random() * 0.7,
      }));
    };

    const handleResize = () => {
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      initParticles(canvas.width, canvas.height);
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let animId;
    const loop = () => {
      const s = stateRef.current;
      s.currentSpeed = lerp(s.currentSpeed, s.targetSpeed, 0.04);

      const W   = canvas.width;
      const H   = canvas.height;
      const ctx = canvas.getContext('2d');

      // Meteorological convention: direction = wind comes FROM (0=N, 90=E)
      // flip 180° to get the "to" direction, then convert to canvas axes
      const rad  = ((s.direction + 180) % 360) * (Math.PI / 180);
      const dx   = Math.sin(rad);   // canvas x increases rightward
      const dy   = -Math.cos(rad);  // canvas y increases downward

      const baseSpd = 0.6 + s.currentSpeed * 0.28;

      // Ghosting trail
      ctx.fillStyle = 'rgba(9,13,22,0.18)';
      ctx.fillRect(0, 0, W, H);

      s.particles.forEach(p => {
        p.x    += dx * baseSpd * p.spd;
        p.y    += dy * baseSpd * p.spd;
        p.life += 0.013;

        const oob = p.x < -12 || p.x > W + 12 || p.y < -12 || p.y > H + 12;
        if (p.life > 1 || oob) {
          // Spawn from upstream edge
          if (Math.abs(dx) >= Math.abs(dy)) {
            p.x = dx > 0 ? -8 : W + 8;
            p.y = Math.random() * H;
          } else {
            p.x = Math.random() * W;
            p.y = dy > 0 ? -8 : H + 8;
          }
          p.life = 0;
        }

        const alpha = Math.sin(p.life * Math.PI) * 0.85;
        const sz    = 1.3 + p.spd * 0.8;

        // Tail line
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - dx * baseSpd * p.spd * 5, p.y - dy * baseSpd * p.spd * 5);
        ctx.strokeStyle = `rgba(16,185,129,${alpha * 0.28})`;
        ctx.lineWidth   = sz * 0.55;
        ctx.stroke();

        // Head dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16,185,129,${alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(animId); };
  }, []);

  const kmh = (speed * 3.6).toFixed(1);
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dirLabel = dirs[Math.round(direction / 45) % 8];

  return (
    <div ref={containerRef} onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{ background: 'rgba(9,13,22,0.92)', border: '1px solid rgba(16,185,129,0.18)', height: 160,
               transition: 'transform 200ms ease' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.015)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Wind Flow</span>
        </div>
        <div>
          <div className="flex items-end gap-1">
            <span className="font-extrabold leading-none text-emerald-400" style={{ fontSize: 38 }}>{kmh}</span>
            <span className="text-xs font-bold text-emerald-400/50 mb-1.5">km/h</span>
          </div>
          <p className="text-xs font-semibold text-white/40 mt-0.5">From {dirLabel}</p>
        </div>
      </div>
      <span className="absolute top-3 right-3 text-[9px] text-white/15 group-hover:text-white/35 transition-all duration-300 pointer-events-none">tap ↑</span>
    </div>
  );
};

// ─── 4. Thermal Gradient — isothermic shifting radial zones ───────────────
export const ThermalGradient = ({ temp = 28, feelsLike = 30, onClick }) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const stateRef     = useRef({ targetTemp: temp, currentTemp: temp, feelsLike, t: 0 });

  useEffect(() => { stateRef.current.targetTemp = temp; stateRef.current.feelsLike = feelsLike; }, [temp, feelsLike]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => { canvas.width = container.clientWidth; canvas.height = container.clientHeight; };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    const getRGB = (t) => {
      if (t < 10) return [96, 165, 250];   // cold blue
      if (t < 20) return [52, 211, 153];   // cool green
      if (t < 28) return [250, 204, 21];   // warm yellow
      if (t < 34) return [251, 146, 60];   // hot orange
      return [239, 68, 68];                // very hot red
    };

    let animId;
    const loop = () => {
      const s = stateRef.current;
      s.currentTemp = lerp(s.currentTemp, s.targetTemp, 0.03);
      s.t += 0.007;

      const W   = canvas.width;
      const H   = canvas.height;
      const ctx = canvas.getContext('2d');
      const [r, g, b] = getRGB(s.currentTemp);

      ctx.clearRect(0, 0, W, H);

      // 4 drifting isothermal radial zones
      [
        { cx: 0.15 + Math.sin(s.t * 0.8)  * 0.12, cy: 0.4  + Math.cos(s.t * 0.6)  * 0.18, rad: 0.75, alpha: 0.28 },
        { cx: 0.75 + Math.sin(s.t * 0.7 + 2) * 0.1, cy: 0.55 + Math.cos(s.t * 0.9)  * 0.14, rad: 0.55, alpha: 0.22 },
        { cx: 0.5  + Math.sin(s.t * 1.1)  * 0.1, cy: 0.25 + Math.cos(s.t * 0.75) * 0.12, rad: 0.42, alpha: 0.16 },
        { cx: 0.35 + Math.sin(s.t * 0.5 + 1) * 0.08, cy: 0.7 + Math.cos(s.t * 1.1)  * 0.1, rad: 0.38, alpha: 0.12 },
      ].forEach(({ cx, cy, rad, alpha }) => {
        const gx = cx * W; const gy = cy * H; const gr2 = rad * Math.max(W, H);
        const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr2);
        gr.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
        gr.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.45})`);
        gr.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);
      });

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(animId); };
  }, []);

  const color = temp < 18 ? 'text-blue-400' : temp < 26 ? 'text-emerald-400' : temp < 33 ? 'text-amber-400' : 'text-red-400';

  return (
    <div ref={containerRef} onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{ background: 'rgba(9,13,22,0.85)', border: '1px solid rgba(255,255,255,0.07)', height: 160,
               transition: 'transform 200ms ease' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.015)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Thermometer className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Temperature</span>
        </div>
        <div>
          <div className="flex items-end gap-1">
            <span className={`font-extrabold leading-none ${color}`} style={{ fontSize: 42 }}>{Math.round(temp)}</span>
            <span className={`text-xl font-bold mb-1 opacity-50 ${color}`}>°C</span>
          </div>
          <p className="text-xs font-semibold text-white/40 mt-0.5">Feels {Math.round(feelsLike)}°C</p>
        </div>
      </div>
      <span className="absolute top-3 right-3 text-[9px] text-white/15 group-hover:text-white/35 transition-all duration-300 pointer-events-none">tap ↑</span>
    </div>
  );
};

// ─── Matrix grid — 2×2 on mobile, 4-across on lg ──────────────────────────
const FluidWeatherMatrix = ({ weatherData, aqiData, onParamClick }) => {
  const humidity  = weatherData?.main?.humidity ?? 60;
  const windSpd   = weatherData?.wind?.speed    ?? 3;
  const windDeg   = weatherData?.wind?.deg      ?? 270;
  const temp      = weatherData?.main?.temp     ?? 28;
  const feelsLike = weatherData?.main?.feels_like ?? temp;
  const aqi       = aqiData?.list?.[0]?.main?.aqi ?? 1;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <AQIParticleField  aqi={aqi}         onClick={() => onParamClick?.('aqi')}      />
      <HumidityWave      humidity={humidity} onClick={() => onParamClick?.('humidity')} />
      <WindStreamlines   speed={windSpd} direction={windDeg} onClick={() => onParamClick?.('wind')}     />
      <ThermalGradient   temp={temp} feelsLike={feelsLike}   onClick={() => onParamClick?.('feelsLike')} />
    </div>
  );
};

export default FluidWeatherMatrix;
