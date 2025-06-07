declare module 'next-themes' {
	export interface ThemeProviderProps {
		attribute?: string;
		defaultTheme?: string;
		enableSystem?: boolean;
		storageKey?: string;
		value?: {
			dark: string;
			light: string;
			system: string;
		};
		children: React.ReactNode;
	}

	export function ThemeProvider(props: ThemeProviderProps): JSX.Element;

	export interface UseThemeProps {
		themes?: string[];
		forcedTheme?: string;
		setTheme: (theme: string) => void;
		theme?: string;
		resolvedTheme?: string;
		systemTheme?: 'dark' | 'light';
	}

	export function useTheme(): UseThemeProps;
}
