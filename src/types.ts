export type TemperatureUnit = "celsius" | "fahrenheit";
export type PetMood = "loading" | "morning_work" | "morning_slack" | "lunch" | "afternoon_nap" | "afternoon_work" | "dinner" | "evening_play" | "night_sleep" | "happy" | "dragging" | "sunny" | "cloudy" | "rainy" | "snowy" | "stormy";

export interface CitySettings {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface AppSettings {
  city: CitySettings | null;
  temperatureUnit: TemperatureUnit;
  alwaysOnTop: boolean;
  opacity: number;
  refreshIntervalMinutes: number;
 animationFrequency: number;
  windowX?: number;
  windowY?: number;
}

export interface WeatherSnapshot {
  city: CitySettings;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isDay: boolean;
  timezone: string;
  updatedAt: string;
  stale?: boolean;
}

declare global {
  interface Window {
    lineDog: {
      settings: {
        get: () => Promise<AppSettings>;
        update: (partial: Partial<AppSettings>) => Promise<AppSettings>;
       toggle: () => Promise<void>;
        close: () => Promise<void>;
      };
      weather: {
        searchCity: (query: string) => Promise<CitySettings[]>;
        getCurrent: (settings: AppSettings) => Promise<WeatherSnapshot | null>;
        reverseGeocode: (lat: number, lng: number) => Promise<CitySettings>;
      };
     tray: {
       triggerRefresh: () => Promise<void>;
     };
    onSettingsToggle: (callback: () => void) => () => void;
    onTrayRefresh: (callback: () => void) => () => void;
    onSettingsUpdated: (callback: (settings: AppSettings) => void) => () => void;
    onDragModeChanged: (callback: (v: boolean) => void) => () => void;
    window: {
      setPassthrough: (enabled: boolean) => Promise<void>;
      getPassthrough: () => Promise<boolean>;
      closeSettings: () => Promise<void>;
      moveBy: (dx: number, dy: number) => Promise<void>;
      setAutostart: (enabled: boolean) => Promise<void>;
      getAutostart: () => Promise<boolean>;
    };
    dragMode: {
      get: () => Promise<boolean>;
      set: (v: boolean) => Promise<void>;
    };
  };
  }
}
