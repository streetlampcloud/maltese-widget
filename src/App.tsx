import { useCallback, useEffect, useState } from "react";
import { Pet } from "./components/Pet";
import { SettingsPanel } from "./components/SettingsPanel";
import type { AppSettings, PetMood, WeatherSnapshot } from "./types";
import { choosePetMood, getWeatherReaction, weatherLabel, formatTemperature } from "./weather";

const fallbackSettings: AppSettings = {
  city: null, temperatureUnit: "celsius",
  alwaysOnTop: true, opacity: 0.96,
  refreshIntervalMinutes: 30, animationFrequency: 1
};

function PetMode() {
  const [settings, setSettings] = useState<AppSettings>(fallbackSettings);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [reactMood, setReactMood] = useState<PetMood | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [weatherDisplay, setWeatherDisplay] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  const refreshWeather = useCallback(async (next = settings) => {
    if (!next.city) { setLoading(false); return; }
    setLoading(true); setWeatherError("");
    try {
      const s = await window.lineDog.weather.getCurrent(next);
      setWeather(s);
      if (s?.stale) setWeatherError("网络不稳，正在显示上次天气。");
    } catch {
      setWeatherError("天气暂时没有回来。");
    } finally { setLoading(false); }
  }, [settings]);

  useEffect(() => {
    window.lineDog.settings.get().then((stored) => {
      setSettings(stored);
      refreshWeather(stored);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => refreshWeather(), settings.refreshIntervalMinutes * 60 * 1000);
    return () => clearInterval(timer);
  }, [refreshWeather, settings.refreshIntervalMinutes]);

  useEffect(() => {
    const onUpdate = (updated: AppSettings) => setSettings(updated);
    const unsub = window.lineDog.onSettingsUpdated(onUpdate);
    return unsub;
  }, []);

  useEffect(() => {
    const doRefresh = () => refreshWeather();
    const unsub = window.lineDog.onTrayRefresh(doRefresh);
    return unsub;
  }, [refreshWeather]);

  useEffect(() => {
    if (!weather || loading) return;
    const text = formatTemperature(weather.temperature, settings.temperatureUnit) + " " + weatherLabel(weather.weatherCode);
    setWeatherDisplay(text);
    const t = setTimeout(() => setWeatherDisplay(""), 60000);
    return () => clearTimeout(t);
  }, [weather, loading, settings.temperatureUnit]);

  useEffect(() => {
    if (!weather) return;
    const show = () => {
      const text = formatTemperature(weather.temperature, settings.temperatureUnit) + " " + weatherLabel(weather.weatherCode);
      setWeatherDisplay(text);
      setTimeout(() => setWeatherDisplay(""), 60000);
    };
    const check = () => { const d = new Date(); if (d.getMinutes() === 0 && d.getSeconds() < 5) show(); };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [weather, settings.temperatureUnit]);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 3000);
    return () => clearTimeout(t);
  }, []);

 useEffect(() => { window.lineDog.dragMode.get().then(setDragMode); }, []);
 useEffect(() => { window.lineDog.dragMode.set(dragMode); }, [dragMode]);
 useEffect(() => {
   if (!dragMode || isDragging) return;
   const t = setTimeout(() => setDragMode(false), 60000);
    return () => clearTimeout(t);
  }, [dragMode, isDragging]);
  useEffect(() => { const unsub = window.lineDog.onDragModeChanged(setDragMode); return unsub; }, []);

  const displayMood: PetMood = (loading || initialLoading) ? "loading" : (reactMood ?? (isDragging ? "dragging" : isHovering ? "happy" : choosePetMood({ loading: false, hour: new Date().getHours() })));

  return (
    <main className="app">
      <Pet mood={displayMood} speed={settings.animationFrequency}
        dragMode={dragMode}
        onHoverChange={setIsHovering}
        onDragChange={setIsDragging}
        customMessage={weatherDisplay || undefined}
        onPet={() => {
          if (weather) {
            setReactMood(getWeatherReaction({ code: weather.weatherCode }));
            setTimeout(() => setReactMood(null), 3000);
            setWeatherDisplay(formatTemperature(weather.temperature, settings.temperatureUnit) + " " + weatherLabel(weather.weatherCode));
            setTimeout(() => setWeatherDisplay(""), 10000);
          } else {
            setReactMood("happy");
            setTimeout(() => setReactMood(null), 3000);
          }
        }}
      />
    </main>
  );
}

function SettingsMode() {
  const [settings, setSettings] = useState<AppSettings>(fallbackSettings);
  const [dragMode, setDragMode] = useState(false);

 useEffect(() => { window.lineDog.settings.get().then(setSettings); }, []);
 useEffect(() => { window.lineDog.dragMode.get().then(setDragMode); }, []);
  useEffect(() => { window.lineDog.dragMode.set(dragMode); }, [dragMode]);
 async function saveSettings(p: Partial<AppSettings>) {
    const updated = await window.lineDog.settings.update(p);
    setSettings(updated);
  }
  return (
    <main className="app">
      <SettingsPanel settings={settings} onSave={saveSettings} onRefreshWeather={() => window.lineDog.tray.triggerRefresh()} dragMode={dragMode} onDragModeChange={setDragMode} />
    </main>
  );
}

export default function App() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "settings") return <SettingsMode />;
  return <PetMode />;
}
