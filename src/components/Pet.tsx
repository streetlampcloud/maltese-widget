import { useEffect, useState, useRef, type CSSProperties } from "react";
import type { PetMood } from "../types";

const moods: Record<PetMood, string> = {
  loading: "正在加载...",
  morning_work: "早上好！开始工作吧",
  morning_slack: "摸鱼中...",
  lunch: "吃饭时间到！",
  afternoon_nap: "午休一下...",
  afternoon_work: "下午继续加油",
  dinner: "晚餐时间~",
  evening_play: "放松一下！",
  night_sleep: "晚安...zZZ",
  happy: "嘿嘿~被摸了",
  dragging: "带我走吧~",
  sunny: "天气真好~",
  cloudy: "阴天呢",
  rainy: "下雨了~",
  snowy: "下雪啦！",
  stormy: "打雷了..."
};

export function Pet({ mood, speed, onPet, customMessage, onHoverChange, onDragChange, dragMode }: {
  mood: PetMood; speed: number; onPet: () => void; customMessage?: string; onHoverChange?: (h: boolean) => void; onDragChange?: (d: boolean) => void; dragMode?: boolean;
}) {
  const assetBase = `./assets/pet/${mood}`;
  const duration = `${Math.max(1.4, 3 / speed)}s`;
  const [assetFailed, setAssetFailed] = useState(false);
  const [imgExtIdx, setImgExtIdx] = useState(0);
  const exts = ['gif', 'png', 'jpg'];

  useEffect(() => {
    setAssetFailed(false);
    setImgExtIdx(0);
  }, [mood]);

  function handleMouseEnter() { if (onHoverChange) onHoverChange(true); }
  function handleMouseLeave() { if (onHoverChange) onHoverChange(false); }

  function handleMouseDown(e: React.MouseEvent) {
    if (!dragMode) { onPet(); return; }
    e.preventDefault();
    if (onDragChange) onDragChange(true);

    let startX = e.screenX;
    let startY = e.screenY;
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.screenX - startX;
      const dy = ev.screenY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        moved = true;
        window.lineDog.window.moveBy(dx, dy);
        startX = ev.screenX;
        startY = ev.screenY;
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (onDragChange) onDragChange(false);
      if (!moved) onPet();
    };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
  }

  return (
    <button className={`pet pet-${mood}`} style={{ "--pet-speed": duration } as CSSProperties} draggable={false}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseDown={handleMouseDown}
      onDragStart={(e) => e.preventDefault()}
      aria-label="点击小狗互动">
      {!assetFailed && (
        <img src={`${assetBase}.${exts[imgExtIdx]}`} alt="" className="pet-asset" draggable={false} onError={() => { if (imgExtIdx < 2) setImgExtIdx(imgExtIdx + 1); else setAssetFailed(true); }} />
      )}
      {assetFailed && (
        <span className="pet-fallback" aria-hidden="true">
          <svg viewBox="0 0 220 180" role="img">
            <path className="dog-line" d="M62 75c-11-26 16-47 41-29 16-19 47-14 56 12 21 1 34 16 31 36-4 31-39 49-79 49-44 0-78-21-82-49-2-14 8-22 33-19Z" />
            <path className="dog-line" d="M77 61c-18-19-40-18-48-6-7 12 0 28 22 30" />
            <path className="dog-line" d="M158 61c19-17 39-14 46-1 7 13-3 28-25 30" />
            <path className="dog-line" d="M88 92c0 5-3 9-8 9s-8-4-8-9 3-9 8-9 8 4 8 9Z" />
            <path className="dog-line" d="M150 92c0 5-3 9-8 9s-8-4-8-9 3-9 8-9 8 4 8 9Z" />
            <path className="dog-line" d="M108 104c5 6 13 6 18 0" />
            <path className="dog-line mood-mouth" d="M91 124c16 14 43 14 58 0" />
            <path className="dog-line" d="M52 141c-12 20 4 28 20 16" />
          </svg>
        </span>
      )}
      <span className="pet-bubble" onMouseEnter={(e) => e.stopPropagation()}>{customMessage ?? moods[mood]}</span>
    </button>
  );
}
