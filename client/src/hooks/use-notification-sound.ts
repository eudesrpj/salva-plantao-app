import { useCallback, useRef, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { invalidateSettingsCache, updateCachedSettings } from "@/lib/soundPlayer";

export type SoundTheme = "default" | "soft" | "alert" | "medical";
export type SoundType = "chat" | "notification";

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

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);

  const { data: serverSettings, isLoading } = useQuery<SoundSettings>({
    queryKey: ["/api/sound-settings"],
    retry: false,
    staleTime: 60000,
  });

  useEffect(() => {
    if (serverSettings) {
      setLocalSettings({
        soundEnabled: serverSettings.soundEnabled ?? true,
        soundVolume: serverSettings.soundVolume ?? 70,
        soundTheme: (serverSettings.soundTheme as SoundTheme) ?? "default",
        chatSoundEnabled: serverSettings.chatSoundEnabled ?? true,
        notificationSoundEnabled: serverSettings.notificationSoundEnabled ?? true,
      });
    }
  }, [serverSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SoundSettings>) => {
      const res = await apiRequest("PATCH", "/api/sound-settings", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sound-settings"] });
    },
  });

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, volume: number) => {
    try {
      const audioContext = getAudioContext();
      
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      const normalizedVolume = Math.max(0, Math.min(1, volume / 100)) * 0.3;
      gainNode.gain.setValueAtTime(normalizedVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn("Failed to play notification sound:", error);
    }
  }, [getAudioContext]);

  const playSound = useCallback((type: SoundType) => {
    const settings = localSettings;

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
  }, [localSettings, playTone]);

  const playChatSound = useCallback(() => playSound("chat"), [playSound]);
  const playNotificationSound = useCallback(() => playSound("notification"), [playSound]);

  const testSound = useCallback((theme: SoundTheme, type: SoundType = "notification") => {
    const themeConfig = SOUND_THEMES[theme] || SOUND_THEMES.default;
    const frequencies = type === "chat" ? themeConfig.chat : themeConfig.notification;
    const duration = themeConfig.duration;
    const volume = localSettings.soundVolume;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        playTone(freq, duration, volume);
      }, index * (duration + 20));
    });
  }, [localSettings.soundVolume, playTone]);

  const updateSettings = useCallback((newSettings: Partial<SoundSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...newSettings }));
    updateCachedSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  }, [updateSettingsMutation]);

  return {
    settings: localSettings,
    isLoading,
    playChatSound,
    playNotificationSound,
    testSound,
    updateSettings,
    isSaving: updateSettingsMutation.isPending,
  };
}

export const SOUND_THEME_LABELS: Record<SoundTheme, string> = {
  default: "Padrão",
  soft: "Suave",
  alert: "Alerta",
  medical: "Médico",
};
