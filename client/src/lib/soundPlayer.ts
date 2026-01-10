export type SoundTheme = "default" | "soft" | "alert" | "medical";
export type SoundType = "chat" | "notification";

interface SoundFrequencies {
  chat: number[];
  notification: number[];
  duration: number;
}

const SOUND_THEMES: Record<SoundTheme, SoundFrequencies> = {
  default: {
    chat: [800, 1000],
    notification: [600, 900, 600],
    duration: 100,
  },
  soft: {
    chat: [400, 500],
    notification: [350, 450],
    duration: 150,
  },
  alert: {
    chat: [1200, 1400],
    notification: [1000, 1200, 1400],
    duration: 80,
  },
  medical: {
    chat: [523, 659],
    notification: [440, 554, 659],
    duration: 120,
  },
};

const STORAGE_KEY = "soundSettings";

interface SoundSettings {
  soundEnabled: boolean;
  soundVolume: number;
  soundTheme: SoundTheme;
  chatSoundEnabled: boolean;
  notificationSoundEnabled: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  soundEnabled: true,
  soundVolume: 70,
  soundTheme: "default",
  chatSoundEnabled: true,
  notificationSoundEnabled: true,
};

let audioContext: AudioContext | null = null;
let cachedSettings: SoundSettings | null = null;
let settingsPromise: Promise<SoundSettings> | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, volume: number): void {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const normalizedVolume = Math.max(0, Math.min(1, volume / 100)) * 0.3;
    gainNode.gain.setValueAtTime(normalizedVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (error) {
    console.warn("Failed to play sound:", error);
  }
}

async function fetchSettings(): Promise<SoundSettings> {
  try {
    const res = await fetch("/api/sound-settings", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      return {
        soundEnabled: data.soundEnabled ?? true,
        soundVolume: data.soundVolume ?? 70,
        soundTheme: (data.soundTheme as SoundTheme) ?? "default",
        chatSoundEnabled: data.chatSoundEnabled ?? true,
        notificationSoundEnabled: data.notificationSoundEnabled ?? true,
      };
    }
  } catch (e) {
    console.warn("Failed to fetch sound settings:", e);
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
  }
  return DEFAULT_SETTINGS;
}

async function getSettings(): Promise<SoundSettings> {
  if (cachedSettings) return cachedSettings;
  
  if (!settingsPromise) {
    settingsPromise = fetchSettings().then(settings => {
      cachedSettings = settings;
      return settings;
    });
  }
  
  return settingsPromise;
}

export function updateCachedSettings(newSettings: Partial<SoundSettings>): void {
  if (cachedSettings) {
    cachedSettings = { ...cachedSettings, ...newSettings };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cachedSettings, ...newSettings }));
}

export function invalidateSettingsCache(): void {
  cachedSettings = null;
  settingsPromise = null;
}

export async function playSound(type: SoundType): Promise<void> {
  const settings = await getSettings();

  if (!settings.soundEnabled) return;
  if (type === "chat" && !settings.chatSoundEnabled) return;
  if (type === "notification" && !settings.notificationSoundEnabled) return;

  const theme = SOUND_THEMES[settings.soundTheme] || SOUND_THEMES.default;
  const frequencies = type === "chat" ? theme.chat : theme.notification;
  const duration = theme.duration;
  const volume = settings.soundVolume;

  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      playTone(freq, duration, volume);
    }, index * (duration + 20));
  });
}

export function playChatSound(): void {
  playSound("chat");
}

export function playNotificationSound(): void {
  playSound("notification");
}
