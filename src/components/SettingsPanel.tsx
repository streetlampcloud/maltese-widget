import { useEffect, useState } from "react";
import type { AppSettings, CitySettings } from "../types";

export function SettingsPanel({
  settings,
  onSave,
  onRefreshWeather,
  dragMode,
  onDragModeChange
}: {
  settings: AppSettings;
  onSave: (partial: Partial<AppSettings>) => Promise<void>;
  onRefreshWeather: () => void;
  dragMode?: boolean;
  onDragModeChange?: (v: boolean) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [passthrough, setPassthrough] = useState(false);
  const [autostart, setAutostart] = useState(false);
  const [query, setQuery] = useState(settings.city?.name ?? "");
  const [cities, setCities] = useState<CitySettings[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    window.lineDog.window.getPassthrough().then(setPassthrough);
    window.lineDog.window.getAutostart().then(setAutostart);
  }, []);

  async function searchCity() {
    if (!query.trim()) return;
    setSearching(true);
    setMessage("");
    try {
      const results = await window.lineDog.weather.searchCity(query);
      setCities(results);
      if (results.length === 0) setMessage("没有找到这个城市，换个名字试试。");
    } catch {
      setMessage("城市搜索失败，请检查网络。");
    } finally {
      setSearching(false);
    }
  }

  async function togglePassthrough(enabled: boolean) {
    setPassthrough(enabled);
    await window.lineDog.window.setPassthrough(enabled);
  }

  async function toggleAutostart(enabled: boolean) {
    setAutostart(enabled);
    await window.lineDog.window.setAutostart(enabled);
  }

  async function toggleDragMode(enabled: boolean) {
    if (enabled) {
      setPassthrough(false);
      await window.lineDog.window.setPassthrough(false);
    }
    onDragModeChange?.(enabled);
  }

  return (
    <section className="settings-panel">
      <div className="settings-header">
        <h2>设置</h2>
        <button className="settings-close" onClick={() => window.lineDog.window.closeSettings()}>×</button>
      </div>

      <div className="settings-scroll">
        {/* Weather section */}
        <div className="settings-section">
          <div className="section-label">天气</div>
          <div className="section-card">
            <div className="setting-row">
              <div className="row-label">城市</div>
              <div className="city-input">
                <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchCity()} placeholder="搜索城市..." />
                <button onClick={searchCity} disabled={searching}>{searching ? "…" : "搜索"}</button>
              </div>
            </div>
            {cities.length > 0 && (
              <div className="city-results">
                {cities.map((city) => (
                  <button key={`${city.latitude}-${city.longitude}`}
                    className={draft.city?.latitude === city.latitude ? "city-selected" : ""}
                    onClick={() => { setDraft((prev) => ({ ...prev, city })); setCities([]); onSave({ city }); }}
                  >
                    <span>{city.name}</span>
                    <small>{[city.admin1, city.country].filter(Boolean).join(" · ")}</small>
                  </button>
                ))}
              </div>
            )}
            {message && <p className="settings-message">{message}</p>}
            {draft.city && (
              <div className="setting-row">
                <div className="row-label">当前城市</div>
                <div className="row-value">{draft.city.name}</div>
              </div>
            )}
            <div className="setting-row">
              <div className="row-label">温度单位</div>
              <div className="segmented">
                <button className={draft.temperatureUnit === "celsius" ? "seg-selected" : ""} onClick={() => { setDraft({ ...draft, temperatureUnit: "celsius" }); onSave({ temperatureUnit: "celsius" }); }}>°C</button>
                <button className={draft.temperatureUnit === "fahrenheit" ? "seg-selected" : ""} onClick={() => { setDraft({ ...draft, temperatureUnit: "fahrenheit" }); onSave({ temperatureUnit: "fahrenheit" }); }}>°F</button>
              </div>
            </div>
            <div className="setting-row">
              <div className="row-label">更新间隔</div>
              <div className="row-value">{draft.refreshIntervalMinutes} 分钟</div>
            </div>
            <input type="range" min="5" max="180" step="5" value={draft.refreshIntervalMinutes}
              onChange={(e) => { const v = Number(e.target.value); setDraft({ ...draft, refreshIntervalMinutes: v }); onSave({ refreshIntervalMinutes: v }); }} />
          </div>
        </div>

        {/* Window section */}
        <div className="settings-section">
          <div className="section-label">窗口</div>
          <div className="section-card">
            <div className="setting-row">
              <div className="row-label">置顶显示</div>
              <label className="toggle-switch">
                <input type="checkbox" hidden checked={draft.alwaysOnTop}
                  onChange={(e) => { setDraft({ ...draft, alwaysOnTop: e.target.checked }); onSave({ alwaysOnTop: e.target.checked }); }} />
                <span className="toggle-track" />
              </label>
            </div>
            <div className="setting-row">
              <div className="row-label">鼠标穿透</div>
              <label className="toggle-switch">
                <input type="checkbox" hidden checked={passthrough}
                  onChange={(e) => togglePassthrough(e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
            <div className="setting-row">
              <div className="row-label">拖动模式</div>
              <label className="toggle-switch">
                <input type="checkbox" hidden checked={dragMode || false}
                  onChange={(e) => toggleDragMode(e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
            <div className="setting-row">
              <div className="row-label">开机自启</div>
              <label className="toggle-switch">
                <input type="checkbox" hidden checked={autostart}
                  onChange={(e) => toggleAutostart(e.target.checked)} />
                <span className="toggle-track" />
              </label>
            </div>
            <div className="setting-row">
              <div className="row-label">透明度</div>
              <div className="row-value">{Math.round(draft.opacity * 100)}%</div>
            </div>
            <input type="range" min="0.55" max="1" step="0.01" value={draft.opacity}
              onChange={(e) => { const v = Number(e.target.value); setDraft({ ...draft, opacity: v }); onSave({ opacity: v }); }} />
          </div>
        </div>

        {/* Pet section */}
        <div className="settings-section">
          <div className="section-label">宠物</div>
          <div className="section-card">
            <div className="setting-row">
              <div className="row-label">动画速度</div>
              <div className="row-value">{draft.animationFrequency.toFixed(1)}x</div>
            </div>
            <input type="range" min="0.5" max="2" step="0.1" value={draft.animationFrequency}
              onChange={(e) => { const v = Number(e.target.value); setDraft({ ...draft, animationFrequency: v }); onSave({ animationFrequency: v }); }} />
          </div>
        </div>

        <button className="settings-refresh" onClick={onRefreshWeather}>刷新天气</button>
      </div>
    </section>
  );
}
