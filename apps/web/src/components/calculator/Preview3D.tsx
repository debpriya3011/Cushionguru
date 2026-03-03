'use client';

import { useState, useRef, useEffect } from 'react';
import { CalculatorSelections, CushionShape } from '@shared-types/calculator';

interface Point { x: number; y: number; }

const getShade = (color: string, factor: number) => {
  return `color-mix(in srgb, ${color}, black ${Math.floor(Math.max(0, (1 - factor) * 100))}%)`;
};

export function Preview3D({ selections, width = 350, height = 350 }: { selections: any, width?: number, height?: number }) {
  const [rotation, setRotation] = useState({ x: -25, y: 35 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  const scaleFactor = 4.5;
  const dims = {
    w: (selections.dimensions.width || 18) * scaleFactor,
    h: (selections.dimensions.length || 24) * scaleFactor,
    d: (selections.dimensions.thickness || 4) * scaleFactor,
    r: ((selections.dimensions.diameter || 20) / 2) * scaleFactor,
    // Trapezium specific
    topW: (selections.dimensions.topWidth || selections.dimensions.width * 0.7) * scaleFactor,
    bottomW: (selections.dimensions.bottomWidth || selections.dimensions.width) * scaleFactor,
  };

  const fabricColor = getFabricColor(selections.fabricCode);

  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotation(prev => ({ ...prev, y: prev.y + 0.5 }));
    }, 40);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700" style={{ width }}>
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-white font-medium text-sm flex items-center gap-2">3D Preview</h3>
        <button onClick={() => setAutoRotate(!autoRotate)} className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${autoRotate ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
          {autoRotate ? 'Rotating' : 'Static'}
        </button>
      </div>

      <div
        className="relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
        style={{ height, perspective: '1500px', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
        onMouseDown={(e) => { setIsDragging(true); setLastMouse({ x: e.clientX, y: e.clientY }); }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          setRotation(prev => ({ x: Math.max(-90, Math.min(90, prev.x - (e.clientY - lastMouse.y) * 0.5)), y: prev.y + (e.clientX - lastMouse.x) * 0.5 }));
          setLastMouse({ x: e.clientX, y: e.clientY });
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`, transformStyle: 'preserve-3d', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
          <div style={{ transformStyle: 'preserve-3d', width: 0, height: 0 }}>
            <ShapeRenderer 
              shape={selections.shape} 
              dims={dims} 
              color={fabricColor} 
              piping={selections.piping === 'Piping'} 
              zipper={selections.zipperPosition}
              ties={selections.ties}
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex gap-2">
          <button onClick={() => setScale(s => Math.max(0.3, s * 0.8))} className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center">−</button>
          <button onClick={() => { setRotation({x: -25, y: 35}); setScale(1); }} className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center">↺</button>
          <button onClick={() => setScale(s => Math.min(2.5, s * 1.2))} className="w-8 h-8 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center">+</button>
        </div>
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function ShapeRenderer({ shape, dims, color, piping, zipper, ties }: any) {
  const { w, h, d, r, topW, bottomW } = dims;
  const pipingStyle = piping ? '3px solid #dc2626' : '1px solid rgba(0,0,0,0.08)';
  
  const Panel = ({ width, height, transform, background, border, clip, hasZipper }: any) => (
    <div style={{
      position: 'absolute', width, height, left: 0, top: 0,
      transform: `translate(-50%, -50%) ${transform}`,
      background: background || color,
      border: border || 'none',
      clipPath: clip || 'none',
      transformStyle: 'preserve-3d',
      backfaceVisibility: 'visible',
    }}>
      {hasZipper && (
        <div style={{
          position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px',
          background: 'rgba(0,0,0,0.3)', borderTop: '1px dashed rgba(255,255,255,0.2)'
        }} />
      )}
    </div>
  );

  const Ties = ({ pW, pH }: {pW: number, pH: number}) => {
    const positions = getTiePositions(shape, pW, pH, ties);
    return (
      <div style={{ transformStyle: 'preserve-3d' }}>
        {positions.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', width: 4, height: 25, background: getShade(color, 0.6),
            transform: `translate(-50%, -50%) translate3d(${p.x - pW/2}px, ${p.y - pH/2}px, ${d/2 + 2}px) rotateZ(45deg)`,
            borderRadius: '2px'
          }} />
        ))}
      </div>
    );
  };

  // RECTANGLE
  if (shape === 'Rectangle') {
    return (
      <>
        <Panel width={w} height={h} transform={`translateZ(${d/2}px)`}  />
        <Panel width={w} height={h} transform={`translateZ(${-d/2}px) rotateY(180deg)`} />
        <Panel width={d} height={h} transform={`rotateY(90deg) translateZ(${w/2}px)`} background={getShade(color, 0.8)}  />
        <Panel width={d} height={h} transform={`rotateY(-90deg) translateZ(${w/2}px)`} background={getShade(color, 0.8)} />
        <Panel width={w} height={d} transform={`rotateX(90deg) translateZ(${h/2}px)` } background={getShade(color, 1.1)}  />
        <Panel width={w} height={d} transform={`rotateX(-90deg) translateZ(${h/2}px)`} background={getShade(color, 0.7)} />
        
      </>
    );
  }

  // ROUND
  if (shape === 'Round') {
    const segments = 48;
    return (
      <>
        <Panel width={r*2} height={r*2} transform={`rotateX(90deg) translateZ(${d/2}px)`}  clip="circle(50%)" />
        <Panel width={r*2} height={r*2} transform={`rotateX(90deg) translateZ(${-d/2}px)`} clip="circle(50%)" />
        {Array.from({ length: segments }).map((_, i) => (
          <Panel key={i} width={(2*Math.PI*r/segments)+1} height={d} 
            transform={`rotateY(${(i/segments)*360}deg) translateZ(${r}px)`} 
            background={getShade(color, 0.85 + Math.cos((i/segments)*Math.PI*2)*0.1)} 
            />
        ))}
      </>
    );
  }

  if (shape === 'Triangle') {
    const slope = Math.sqrt((w/2)**2 + h**2);
    const angle = (Math.atan2(h, w/2) * 180) / Math.PI;
    const triPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
    return (
      <>
        <Panel width={w} height={h} transform={`translateZ(${d/2}px)`} clip={triPath}  />
        <Panel width={w} height={h} transform={`translateZ(${-d/2}px) rotateY(180deg)`} clip={triPath} />
        <Panel width={w} height={d} transform={`translateY(${h/2}px) rotateX(-90deg)`} background={getShade(color, 0.7)} />
        <Panel width={slope} height={d} transform={`translate(${-w/4}px, 0) rotateZ(-${angle}deg) rotateX(90deg)`} background={getShade(color, 0.9)} />
        <Panel width={slope} height={d} transform={`translate(${w/4}px, 0) rotateZ(${angle}deg) rotateX(90deg)`} background={getShade(color, 0.9)} />
      </>
    );
  }

  if (shape === 'L Shape' || shape === 'T Cushion') {
    const isL = shape === 'L Shape';
    const mainW = isL ? w * 0.4 : w * 0.5;
    const headH = h * 0.4;
    const stemH = h - headH;
    const wingW = isL ? w - mainW : (w - mainW) / 2;

    const polyPath = isL 
      ? `polygon(0 0, ${mainW}px 0, ${mainW}px ${stemH}px, 100% ${stemH}px, 100% 100%, 0 100%)`
      : `polygon(0 0, 100% 0, 100% ${headH}px, ${w-wingW}px ${headH}px, ${w-wingW}px 100%, ${wingW}px 100%, ${wingW}px ${headH}px, 0 ${headH}px)`;
    
    return (
      <>
        <Panel width={w} height={h} transform={`translateZ(${d/2}px)`} clip={polyPath}  />
        <Panel width={w} height={h} transform={`translateZ(${-d/2}px) `} clip={polyPath} />
        
        {isL ? (
          <>
            <Panel width={d} height={h} transform={`translateX(${-w/2}px) rotateY(-90deg)`} background={getShade(color, 0.8)} />
            <Panel width={d} height={stemH} transform={`translateX(${-w/2 + mainW}px) translateY(${-h/2 + stemH/2}px) rotateY(90deg)`} background={getShade(color, 0.8)} />
            <Panel width={d} height={headH} transform={`translateX(${w/2}px) translateY(${h/2 - headH/2}px) rotateY(90deg)`} background={getShade(color, 0.8)} />
            <Panel width={mainW} height={d} transform={`translateY(${-h/2}px) translateX(${-w/2 + mainW/2}px) rotateX(90deg)`} background={getShade(color, 1.1)} />
            <Panel width={wingW} height={d} transform={`translateY(${-h/2 + stemH}px) translateX(${w/2 - wingW/2}px) rotateX(90deg)` } background={getShade(color, 1.1)} />
            <Panel width={w} height={d} transform={`translateY(${h/2}px) rotateX(-90deg)`} background={getShade(color, 0.7)} />
          </>
        ) : (
          <>
            <Panel width={d} height={headH} transform={`translateX(${-w/2}px) translateY(${-h/2 + headH/2}px) rotateY(-90deg)`} background={getShade(color, 0.8)}  />
            <Panel width={d} height={headH} transform={`translateX(${w/2}px) translateY(${-h/2 + headH/2}px) rotateY(90deg)` } background={getShade(color, 0.8)} />
            <Panel width={d} height={stemH} transform={`translateX(${-w/2 + wingW}px) translateY(${h/2 - stemH/2}px) rotateY(90deg)`} background={getShade(color, 0.8)} />
            <Panel width={d} height={stemH} transform={`translateX(${w/2 - wingW}px) translateY(${h/2 - stemH/2}px) rotateY(-90deg)`} background={getShade(color, 0.8)} />
            <Panel width={w} height={d} transform={`translateY(${-h/2}px) rotateX(90deg)`} background={getShade(color, 1.1)} />
            <Panel width={wingW} height={d} transform={`translateY(${-h/2 + headH}px) translateX(${-w/2 + wingW/2}px) rotateX(-90deg)`} background={getShade(color, 0.7)} />
            <Panel width={wingW} height={d} transform={`translateY(${-h/2 + headH}px) translateX(${w/2 - wingW/2}px) rotateX(-90deg)`} background={getShade(color, 0.7)} />
            <Panel width={mainW} height={d} transform={`translateY(${h/2}px) rotateX(-90deg)`} background={getShade(color, 0.7)} />
          </>
        )}
      </>
    );
  }




  // TRAPEZIUM (Dynamic Responsiveness)
  if (shape === 'Trapezium') {
    const diff = Math.abs(bottomW - topW) / 2;
    const slope = Math.sqrt(diff**2 + h**2);
    const angle = (Math.atan2(h, diff) * 180) / Math.PI;
    const trapPath = `polygon(${diff}px 0, ${bottomW - diff}px 0, 100% 100%, 0 100%)`;
    
    return (
      <>
        <Panel width={bottomW} height={h} transform={`translateZ(${d/2}px)`} clip={trapPath}  />
        <Panel width={bottomW} height={h} transform={`translateZ(${-d/2}px) rotateY(180deg)`} clip={trapPath} />
        <Panel width={topW} height={d} transform={`translateY(${-h/2}px) rotateX(90deg)`} background={getShade(color, 1.1)}  />
        <Panel width={bottomW} height={d} transform={`translateY(${h/2}px) rotateX(-90deg)`} background={getShade(color, 0.7)}  />
        <Panel width={slope} height={d} transform={`translate(${-bottomW/2 + diff/2}px, 0) rotateZ(-${angle}deg) rotateX(90deg)`} background={getShade(color, 0.85)} />
        <Panel width={slope} height={d} transform={`translate(${bottomW/2 - diff/2}px, 0) rotateZ(${angle}deg) rotateX(90deg)`} background={getShade(color, 0.85)} />
        
      </>
    );
  }

  return null; // Add other shapes (L, T, Triangle) similarly
}

// ==================== HELPERS ====================

function getTiePositions(shape: string, width: number, height: number, ties: string): Point[] {
  if (!ties || ties === 'No ties') return [];
  const positions: Point[] = [];
  const inset = 0.15;

  switch (ties) {
    case '2 Side':
      positions.push({ x: width * 0.2, y: height * 0.5 }, { x: width * 0.8, y: height * 0.5 });
      break;
    case '4 Side':
      positions.push({ x: width*inset, y: height*0.3 }, { x: width*inset, y: height*0.7 }, { x: width*(1-inset), y: height*0.3 }, { x: width*(1-inset), y: height*0.7 });
      break;
    case '4 Corner':
      positions.push({ x: width*0.1, y: height*0.1 }, { x: width*0.9, y: height*0.1 }, { x: width*0.1, y: height*0.9 }, { x: width*0.9, y: height*0.9 });
      break;
    case '8 Side':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        positions.push({ x: width/2 + Math.cos(a)*width*0.4, y: height/2 + Math.sin(a)*height*0.4 });
      }
      break;
  }
  return positions;
}

function getFabricColor(code: string) {
  const map: Record<string, string> = {
    'SOLID_3728_PARIS_RED': '#b91c1c',
    'SOLID_BLACK': '#111827',
    'SOLID_WHITE': '#f8fafc',
    'SOLID_5416_ARUBA': '#0891b2',
  };
  return map[code] || '#64748b';
}