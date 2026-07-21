import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("lineDog", {
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (partial: unknown) => ipcRenderer.invoke("settings:update", partial),
    toggle: () => ipcRenderer.invoke("settings:toggle"),
    close: () => ipcRenderer.invoke("settings:close")
  },
  weather: {
    searchCity: (query: string) => ipcRenderer.invoke("weather:searchCity", query),
    getCurrent: (settings: unknown) => ipcRenderer.invoke("weather:getCurrent", settings),
    reverseGeocode: (lat: number, lng: number) => ipcRenderer.invoke("weather:reverseGeocode", lat, lng)
  },
  tray: {
    triggerRefresh: () => ipcRenderer.invoke("tray:refreshWeather")
  },
  onSettingsToggle: (callback: () => void) => {
    ipcRenderer.on("settings:toggle", callback);
    return () => { ipcRenderer.removeListener("settings:toggle", callback); };
  },
  onTrayRefresh: (callback: () => void) => {
    ipcRenderer.on("tray:refresh", callback);
    return () => { ipcRenderer.removeListener("tray:refresh", callback); };
  },
  onSettingsUpdated: (callback: (data: unknown) => void) => {
    const handler = (_event: unknown, data: unknown) => callback(data);
    ipcRenderer.on("settings:updated", handler);
    return () => { ipcRenderer.removeListener("settings:updated", handler); };
  },
  onDragModeChanged: (callback: (v: boolean) => void) => {
    const handler = (_event: unknown, v: unknown) => callback(v as boolean);
    ipcRenderer.on("dragMode:changed", handler);
    return () => { ipcRenderer.removeListener("dragMode:changed", handler); };
  },
  window: {
    setPassthrough: (enabled: boolean) => ipcRenderer.invoke("window:setPassthrough", enabled),
    getPassthrough: () => ipcRenderer.invoke("window:getPassthrough"),
    closeSettings: () => ipcRenderer.invoke("window:closeSettings"),
    moveBy: (dx: number, dy: number) => ipcRenderer.invoke("window:moveBy", dx, dy),
    setAutostart: (enabled: boolean) => ipcRenderer.invoke("window:setAutostart", enabled),
    getAutostart: () => ipcRenderer.invoke("window:getAutostart")
  },
  dragMode: {
    get: () => ipcRenderer.invoke("dragMode:get"),
    set: (v: boolean) => ipcRenderer.invoke("dragMode:set", v)
  }
});
