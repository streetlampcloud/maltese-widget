import type { PetMood, TemperatureUnit } from "./types";

const RAIN = [51,53,55,56,57,61,63,65,66,67,80,81,82];
const SNOW = [71,73,75,77,85,86];
const STORM = [95,96,99];
const CLOUD = [1,2,3];
const FOG = [45,48];

export function weatherLabel(code?: number) {
  if (code === undefined || code === 0) return "晴";
  if (CLOUD.includes(code)) return "多云";
  if (FOG.includes(code)) return "雾";
  if (RAIN.includes(code)) return "下雨";
  if (SNOW.includes(code)) return "下雪";
  if (STORM.includes(code)) return "雷雨";
  return "天气";
}

export function formatTemperature(v?: number, unit: TemperatureUnit = "celsius") {
  if (v === undefined) return "--";
  return `${Math.round(v)}${unit === "fahrenheit" ? "°F" : "°C"}`;
}

function getHourMood(h: number): PetMood {
  if (h >= 8 && h < 10) return "morning_work";
  if (h >= 10 && h < 12) return "morning_slack";
  if (h >= 12 && h < 13) return "lunch";
  if (h >= 13 && h < 14) return "afternoon_nap";
  if (h >= 14 && h < 18) return "afternoon_work";
  if (h >= 18 && h < 19) return "dinner";
  if (h >= 19 && h < 22) return "evening_play";
  return "night_sleep";
}

export function choosePetMood(args: { loading: boolean; hour: number }): PetMood {
  if (args.loading) return "loading";
  return getHourMood(args.hour);
}

export function getWeatherReaction(args: { code?: number }): PetMood {
  const code = args.code;
  if (code === undefined) return "happy";
  if (RAIN.includes(code)) return "rainy";
  if (SNOW.includes(code)) return "snowy";
  if (STORM.includes(code)) return "stormy";
  if (CLOUD.includes(code)) return "cloudy";
  return "happy";
}
