import { app, BrowserWindow, session, Tray, Menu, nativeImage, ipcMain } from "electron";
import path from "node:path";
import { promises as fs } from "node:fs";
import fsSync from "node:fs";

type TemperatureUnit = "celsius" | "fahrenheit";

interface CitySettings {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface AppSettings {
  city: CitySettings | null;
  temperatureUnit: TemperatureUnit;
  alwaysOnTop: boolean;
  opacity: number;
  refreshIntervalMinutes: number;
 animationFrequency: number;
  windowX?: number;
  windowY?: number;
}

interface CityCandidate extends CitySettings {
  admin1?: string;
}

interface WeatherSnapshot {
  city: CitySettings;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isDay: boolean;
  timezone: string;
  updatedAt: string;
  stale?: boolean;
}

const defaultSettings: AppSettings = {
  city: null,
  temperatureUnit: "celsius",
  alwaysOnTop: true,
  opacity: 0.96,
  refreshIntervalMinutes: 30,
  animationFrequency: 1
};

let petWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isPassthrough = false;
let dragMode = false;

app.setPath("userData", path.join(process.cwd(), ".user-data"));

const settingsPath = () => path.join(app.getPath("userData"), "settings.json");
const weatherCachePath = () => path.join(app.getPath("userData"), "weather-cache.json");
const bootLogPath = () => path.join(app.getPath("userData"), "boot.log");

function bootLog(message: string) {
  try {
    fsSync.mkdirSync(app.getPath("userData"), { recursive: true });
    fsSync.appendFileSync(bootLogPath(), `${new Date().toISOString()} ${message}\n`, "utf8");
  } catch {
    // Logging must never block app startup.
  }
}

process.on("uncaughtException", (error) => bootLog(`uncaughtException ${error.stack ?? error.message}`));
process.on("unhandledRejection", (reason) => bootLog(`unhandledRejection ${String(reason)}`));
bootLog("main module loaded");

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSettings(input: Partial<AppSettings>): AppSettings {
  return {
    ...defaultSettings,
    ...input,
    opacity: clamp(Number(input.opacity ?? defaultSettings.opacity), 0.55, 1),
    refreshIntervalMinutes: clamp(
      Number(input.refreshIntervalMinutes ?? defaultSettings.refreshIntervalMinutes),
      5, 180
    ),
    animationFrequency: clamp(Number(input.animationFrequency ?? defaultSettings.animationFrequency), 0.5, 2)
  };
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readSettings(): Promise<AppSettings> {
  const stored = await readJson<Partial<AppSettings>>(settingsPath());
  return normalizeSettings(stored ?? {});
}

async function writeSettings(next: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings(next);
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(normalized, null, 2), "utf8");
  applyPetWindowPreferences(normalized);
  return normalized;
}

function applyPetWindowPreferences(settings: AppSettings) {
  if (!petWindow) return;
  petWindow.setAlwaysOnTop(settings.alwaysOnTop);
  petWindow.setOpacity(settings.opacity);
}

function createTrayIcon(): Electron.NativeImage {
  const size = 32;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2 + 0.5;
      const cy = y - size / 2 + 0.5;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const idx = (y * size + x) * 4;
      if (dist < 13) {
        buf[idx] = 70; buf[idx + 1] = 50; buf[idx + 2] = 35; buf[idx + 3] = 230;
        if ((Math.abs(x - 11) < 2 && Math.abs(y - 13) < 2) ||
            (Math.abs(x - 21) < 2 && Math.abs(y - 13) < 2)) {
          buf[idx] = 20; buf[idx + 1] = 15; buf[idx + 2] = 10; buf[idx + 3] = 255;
        }
        if (Math.abs(x - 16) < 2 && Math.abs(y - 19) < 1.5) {
          buf[idx] = 30; buf[idx + 1] = 25; buf[idx + 2] = 20; buf[idx + 3] = 255;
        }
      } else {
        buf[idx] = 0; buf[idx + 1] = 0; buf[idx + 2] = 0; buf[idx + 3] = 0;
      }
    }
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

function createPetWindow() {
  bootLog("creating pet window");
  petWindow = new BrowserWindow({
    width: 220, height: 200,
    show: false, frame: false, transparent: true,
    resizable: false, backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: false
    }
  });
  petWindow.once("ready-to-show", () => petWindow?.show());
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    petWindow.loadURL(`${devUrl}?mode=pet`);
  } else {
    petWindow.loadFile(path.join(__dirname, "../dist/index.html"), { query: { mode: "pet" } });
  }
  readSettings().then(s => {
    applyPetWindowPreferences(s);
    if (s.windowX !== undefined && s.windowY !== undefined) {
      petWindow?.setPosition(s.windowX, s.windowY);
    }
  }).catch(() => {});
  petWindow.on('move', () => {
    if (!petWindow) return;
    const [x, y] = petWindow.getPosition();
    readSettings().then(s => fs.writeFile(settingsPath(), JSON.stringify({ ...s, windowX: x, windowY: y }, null, 2))).catch(() => {});
  });
}

function createSettingsWindow() {
  if (settingsWindow) { settingsWindow.focus(); return; }
  bootLog("creating settings window");
  settingsWindow = new BrowserWindow({
    width: 800, height: 800,
    show: false, frame: true, resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: false
    }
  });
  settingsWindow.once("ready-to-show", () => settingsWindow?.show());
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    settingsWindow.loadURL(`${devUrl}?mode=settings`);
  } else {
    settingsWindow.loadFile(path.join(__dirname, "../dist/index.html"), { query: { mode: "settings" } });
  }
  settingsWindow.on("closed", () => { settingsWindow = null; });
}

function weatherDescription(code: number) {
  if ([0].includes(code)) return "晴";
  if ([1, 2, 3].includes(code)) return "多云";
  if ([45, 48].includes(code)) return "雾";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天气";
}

// --- IPC Handlers ---
ipcMain.handle("settings:get", async () => readSettings());

ipcMain.handle("settings:update", async (_event, partial: Partial<AppSettings>) => {
  const current = await readSettings();
  const updated = await writeSettings({ ...current, ...partial });
  petWindow?.webContents.send("settings:updated", updated);
  return updated;
});

ipcMain.handle("window:setPassthrough", async (_event, enabled: boolean) => {
  isPassthrough = enabled;
  if (petWindow) petWindow.setIgnoreMouseEvents(enabled);
});

ipcMain.handle("window:getPassthrough", async () => isPassthrough);

ipcMain.handle("window:closeSettings", async () => {
  if (settingsWindow) { settingsWindow.close(); settingsWindow = null; }
});
ipcMain.handle("window:moveBy", async (_event, dx: number, dy: number) => {
  const [x, y] = petWindow?.getPosition() || [0, 0];
  petWindow?.setPosition(x + dx, y + dy);
});

ipcMain.handle("window:setAutostart", async (_event, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
});

ipcMain.handle("window:getAutostart", async () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle("dragMode:get", async () => dragMode);
ipcMain.handle("dragMode:set", async (_event, v: boolean) => {
  dragMode = v;
  if (v) {
    isPassthrough = false;
    petWindow?.setIgnoreMouseEvents(false);
  }
  petWindow?.webContents.send("dragMode:changed", v);
});

ipcMain.handle("tray:refreshWeather", async () => {
  petWindow?.webContents.send("tray:refresh");
});

ipcMain.handle("weather:searchCity", async (_event, query: string): Promise<CityCandidate[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "zh");
  url.searchParams.set("format", "json");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`城市搜索失败：${response.status}`);
  const payload = (await response.json()) as {
    results?: Array<{ name: string; country?: string; admin1?: string; latitude: number; longitude: number; timezone?: string; }>;
  };
  return (payload.results ?? []).map((item) => ({
    name: item.name, country: item.country, admin1: item.admin1,
    latitude: item.latitude, longitude: item.longitude, timezone: item.timezone ?? "auto"
  }));
});

ipcMain.handle("weather:getCurrent", async (_event, settings: AppSettings): Promise<WeatherSnapshot | null> => {
  if (!settings.city) return null;
  const unit = settings.temperatureUnit === "fahrenheit" ? "fahrenheit" : "celsius";
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(settings.city.latitude));
  url.searchParams.set("longitude", String(settings.city.longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,is_day,weather_code");
  url.searchParams.set("timezone", settings.city.timezone || "auto");
  url.searchParams.set("temperature_unit", unit);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`天气请求失败：${response.status}`);
    const payload = (await response.json()) as {
      timezone?: string; current?: { temperature_2m: number; apparent_temperature: number; is_day: number; weather_code: number; time?: string; };
    };
    if (!payload.current) throw new Error("天气数据为空");
    const snapshot: WeatherSnapshot = {
      city: settings.city, temperature: payload.current.temperature_2m,
      apparentTemperature: payload.current.apparent_temperature,
      weatherCode: payload.current.weather_code, isDay: payload.current.is_day === 1,
      timezone: payload.timezone ?? settings.city.timezone,
      updatedAt: payload.current.time ?? new Date().toISOString()
    };
    await fs.writeFile(weatherCachePath(),
      JSON.stringify({ ...snapshot, description: weatherDescription(snapshot.weatherCode) }, null, 2), "utf8");
    return snapshot;
  } catch (error) {
    const cached = await readJson<WeatherSnapshot>(weatherCachePath());
    if (cached) return { ...cached, stale: true };
    throw error;
  }
});

ipcMain.handle("weather:reverseGeocode", async (_event, lat: number, lng: number) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=zh`;
  const response = await fetch(url);
  const data = await response.json();
  return {
    name: data.address?.city || data.address?.town || data.address?.village || data.address?.county || "未知",
    country: data.address?.country,
    latitude: lat,
    longitude: lng,
    timezone: 'auto'
  };
});

// --- Tray ---
function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("Line Dog 桌宠");
  updateTrayMenu();
  tray.on("double-click", () => createSettingsWindow());
}

function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "设置", click: () => createSettingsWindow() },
    { type: "separator" },
    { label: "退出", click: () => app.quit() }
  ]));
}

// --- App lifecycle ---
app.whenReady().then(() => {
  bootLog("app ready");
  if (session.defaultSession) {
    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
      cb(permission === 'geolocation');
    });
  }
  createPetWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createPetWindow();
});

app.on("before-quit", () => {
  tray?.destroy();
});
