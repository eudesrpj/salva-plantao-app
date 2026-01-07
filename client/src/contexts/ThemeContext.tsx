import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export type Theme = "light" | "dark" | "system";
export type ColorScheme = "blue" | "green" | "purple" | "orange" | "rose";
export type FontSize = "small" | "medium" | "large";

interface ThemePreferences {
  theme: Theme;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  compactMode: boolean;
}

interface ThemeContextType extends ThemePreferences {
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setFontSize: (size: FontSize) => void;
  setCompactMode: (compact: boolean) => void;
  isLoading: boolean;
}

const defaultPrefs: ThemePreferences = {
  theme: "system",
  colorScheme: "blue",
  fontSize: "medium",
  compactMode: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_SCHEMES: Record<ColorScheme, { primary: string; accent: string; ring: string }> = {
  blue: { primary: "201 96% 32%", accent: "199 89% 48%", ring: "201 96% 32%" },
  green: { primary: "142 76% 36%", accent: "142 69% 58%", ring: "142 76% 36%" },
  purple: { primary: "262 83% 58%", accent: "270 95% 75%", ring: "262 83% 58%" },
  orange: { primary: "25 95% 53%", accent: "32 98% 59%", ring: "25 95% 53%" },
  rose: { primary: "346 77% 50%", accent: "340 82% 65%", ring: "346 77% 50%" },
};

const FONT_SIZES: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localPrefs, setLocalPrefs] = useState<ThemePreferences>(() => {
    const saved = localStorage.getItem("theme-prefs");
    return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
  });

  const { data: serverPrefs, isLoading } = useQuery<ThemePreferences>({
    queryKey: ["/api/user-preferences"],
    enabled: isAuthenticated,
  });

  const updatePrefs = useMutation({
    mutationFn: async (prefs: Partial<ThemePreferences>) => {
      const res = await apiRequest("PUT", "/api/user-preferences", prefs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
    },
  });

  const prefs = isAuthenticated && serverPrefs ? serverPrefs : localPrefs;

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  };

  const applyColorScheme = (scheme: ColorScheme) => {
    const root = document.documentElement;
    const colors = COLOR_SCHEMES[scheme];
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--ring", colors.ring);
  };

  const applyFontSize = (size: FontSize) => {
    document.documentElement.style.fontSize = FONT_SIZES[size];
  };

  useEffect(() => {
    applyTheme(prefs.theme);
    applyColorScheme(prefs.colorScheme);
    applyFontSize(prefs.fontSize);
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (prefs.theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [prefs.theme, prefs.colorScheme, prefs.fontSize]);

  const updatePreference = (update: Partial<ThemePreferences>) => {
    const newPrefs = { ...prefs, ...update };
    if (isAuthenticated) {
      updatePrefs.mutate(update);
    } else {
      setLocalPrefs(newPrefs);
      localStorage.setItem("theme-prefs", JSON.stringify(newPrefs));
    }
  };

  return (
    <ThemeContext.Provider value={{
      ...prefs,
      setTheme: (theme) => updatePreference({ theme }),
      setColorScheme: (colorScheme) => updatePreference({ colorScheme }),
      setFontSize: (fontSize) => updatePreference({ fontSize }),
      setCompactMode: (compactMode) => updatePreference({ compactMode }),
      isLoading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
