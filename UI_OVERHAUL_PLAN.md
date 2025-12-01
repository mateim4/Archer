# UI Overhaul Execution Plan: Acrylic & Glassmorphism

## Goal
Migrate Archer's UI to the "Acrylic" design system from DelegateAI, featuring glassmorphism, animated backgrounds, and specific gradients, while retaining Archer's purple accent color.

## Source Files (from DelegateAI)
The following code snippets are extracted from DelegateAI and serve as the source of truth for the migration.

### 1. Global Styles (`frontend/src/styles/globals.css`)
This defines the Tailwind variables and Glassmorphism tokens.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;

    /* Glassmorphism tokens */
    --glass-bg: hsl(var(--background) / 0.24);
    --glass-hover-bg: hsl(var(--background) / 0.30);
    --glass-press-bg: hsl(var(--background) / 0.20);
    --glass-border: hsl(var(--border) / 0.6);
    --glass-shadow: 0 8px 24px 0 hsl(var(--foreground) / 0.08);
    --glass-tint: hsl(var(--accent) / 0.06);

    /* Confirm button gradient (RGB channel values) */
    --confirm-grad-1: 207 186 240; /* #cfbaf0 */
    --confirm-grad-2: 163 196 243; /* #a3c4f3 */
    --confirm-grad-3: 144 219 244; /* #90dbf4 */
    --confirm-grad-opacity: 0.30;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;

    /* Glassmorphism tokens (dark) */
    --glass-bg: hsl(var(--background) / 0.18);
    --glass-hover-bg: hsl(var(--background) / 0.24);
    --glass-press-bg: hsl(var(--background) / 0.16);
    --glass-border: hsl(var(--border) / 0.45);
    --glass-shadow: 0 8px 28px 0 hsl(var(--foreground) / 0.20);
    --glass-tint: hsl(var(--accent) / 0.05);

    /* Confirm button gradient uses same colors in dark */
    --confirm-grad-1: 207 186 240;
    --confirm-grad-2: 163 196 243;
    --confirm-grad-3: 144 219 244;
    --confirm-grad-opacity: 0.30;
  }
}

@layer base {
  * {
    box-sizing: border-box;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 2. Theme Definition (`frontend/src/styles/themes.ts`)
**Action**: Adapt this to use Archer's purple brand colors instead of the blue/cyan ones, but keep the structure.

```typescript
import { teamsLightTheme, teamsDarkTheme, BrandVariants, createLightTheme, createDarkTheme } from '@fluentui/react-components';

// TODO: Replace with Archer's Purple Brand Ramp
const brand: BrandVariants = {
  10: '#0f172a',
  20: '#111827',
  30: '#1f2937',
  40: '#374151',
  50: '#4b5563',
  60: '#64748b',
  70: '#818cf8', 
  80: '#a3c4f3',
  90: '#90dbf4',
  100: '#cfbaf0',
  110: '#b9a5e8',
  120: '#a08edc',
  130: '#8b79d0',
  140: '#6b5db4',
  150: '#56499c',
  160: '#443a7e',
};

const baseLight = createLightTheme(brand);
const baseDark = createDarkTheme(brand);

// Shared overrides to support glass surfaces
const shared = {
  colorNeutralBackground1: 'rgba(255, 255, 255, 0.6)',
  colorNeutralBackground3: 'rgba(255, 255, 255, 0.4)',
  colorNeutralStroke2: 'rgba(0, 0, 0, 0.15)',
};

export const archerLightTheme = {
  ...teamsLightTheme,
  ...baseLight,
  ...shared,
};

export const archerDarkTheme = {
  ...teamsDarkTheme,
  ...baseDark,
  colorNeutralBackground1: 'rgba(40, 40, 40, 0.7)',
  colorNeutralBackground3: 'rgba(50, 50, 50, 0.5)',
  colorNeutralStroke2: 'rgba(255, 255, 255, 0.15)',
  colorNeutralForeground1: '#ffffff',
  colorNeutralForeground2: '#d1d1d1',
};
```

### 3. Styles Hook (`frontend/src/styles/useStyles.ts`)
Contains animations and layout styles.

```typescript
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  // --- Background Animations ---
  fall: {
    animationName: {
      to: { transform: 'translateY(120vh)' },
    },
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  moveFog: {
    animationName: {
      '0%': { transform: 'translateX(-30%) scale(1)', opacity: 0 },
      '25%': { opacity: 1 },
      '75%': { opacity: 1 },
      '100%': { transform: 'translateX(100%) translateY(10%) scale(1.2)', opacity: 0 },
    },
     animationTimingFunction: 'linear',
     animationIterationCount: 'infinite',
  },
  rainbowContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '150vmax',
    height: '150vmax',
    opacity: 0,
    zIndex: 2,
    animationName: {
        from: { opacity: 0, transform: 'translateX(-50%) scale(0.8)' },
        to: { opacity: 0.9, transform: 'translateX(-50%) scale(1)' },
    },
    animationDuration: '5s',
    animationTimingFunction: 'ease-in-out',
    animationDelay: '3s',
    animationFillMode: 'forwards',
  },
  rainbowSecondaryContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '200vmax',
    height: '200vmax',
    opacity: 0,
    zIndex: 1,
    animationName: {
        '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.7)' },      
        '10%': { opacity: 0.3, transform: 'translate(-50%, -50%) scale(0.8)' },   
        '20%': { opacity: 0 },
        '100%': { opacity: 0 },
    },
    animationDuration: '60s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDelay: '15s',
  },
  rainbow: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    filter: 'blur(15px)',
    background: 'radial-gradient(circle, transparent 59%, rgba(255, 179, 186, 0.75) 60.5%, rgba(255, 223, 186, 0.75) 62%, rgba(255, 255, 186, 0.75) 63.5%, rgba(186, 255, 201, 0.75) 65%, rgba(186, 225, 255, 0.75) 66.5%, rgba(204, 186, 255, 0.75) 68%, rgba(230, 186, 255, 0.75) 69.5%, transparent 71%)',
    animationName: {
        '0%': { transform: 'skewY(-2deg) translateY(5vh)', opacity: 0.8 },        
        '30%': { transform: 'skewY(3deg) translateY(-10vh)', opacity: 0.3 },      
        '60%': { transform: 'skewY(-3deg) translateY(10vh)', opacity: 1.0 },      
        '80%': { transform: 'skewY(1deg) translateY(-15vh)', opacity: 0.6 },      
        '100%': { transform: 'skewY(-2deg) translateY(5vh)', opacity: 0.8 },      
    },
    animationDuration: '48s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationDelay: '3s',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    maxHeight: '100vh',
    maxWidth: '100vw',
    color: tokens.colorNeutralForeground1,
    transition: 'background-image 0.8s ease-in-out',
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  rootDark: {
    backgroundColor: '#2c3e50',
    backgroundImage: 'linear-gradient(to bottom, #34495e, #2c3e50)',
  },
  rootLight: {
    backgroundColor: '#a1c4fd',
    backgroundImage: 'linear-gradient(to bottom, #a1c4fd, #c2e9fb)',
  },
  mainUI: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    maxHeight: '100vh',
    maxWidth: '100vw',
    overflow: 'hidden',
    backdropFilter: 'blur(1px)',
  },
});
```

### 4. Animated Background (`frontend/src/components/background/AnimatedBackground.tsx`)

```tsx
import React, { useMemo } from 'react';
import { useStyles } from '../../styles/useStyles';

type AnimatedBackgroundProps = { isDarkTheme: boolean };

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = React.memo(({ isDarkTheme }) => {
    const styles = useStyles();

    const rain = useMemo(() => {
        const dropColor = isDarkTheme ? 'rgba(255, 255, 255, 0.4)' : 'rgba(20, 30, 80, 0.4)';
        return Array.from({ length: 200 }).map((_, i) => (
            <div
                key={`rain-${i}`}
                className={styles.fall}
                style={{
                    position: 'absolute',
                    bottom: '100%',
                    width: '1px',
                    height: '50px',
                    background: `linear-gradient(to bottom, transparent, ${dropColor})`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 1.5 + 0.5}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: (Math.random() * 0.5 + 0.2).toString(),
                }}
            />
        ));
    }, [isDarkTheme, styles.fall]);

    const fog = useMemo(() => {
        const fogColor = isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)';
        return Array.from({ length: 15 }).map((_, i) => (
            <div
                key={`fog-${i}`}
                className={styles.moveFog}
                style={{
                    position: 'absolute',
                    borderRadius: '50%',
                    filter: 'blur(70px)',
                    opacity: '0',
                    background: fogColor,
                    width: `${Math.random() * 30 + 30}%`,
                    height: `${Math.random() * 30 + 30}%`,
                    left: `${Math.random() * 80 - 10}%`,
                    top: `${Math.random() * 80 - 10}%`,
                    animationDuration: `${Math.random() * 40 + 30}s`,
                    animationDelay: `${Math.random() * 10}s`,
                }}
            />
        ));
    }, [isDarkTheme, styles.moveFog]);

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <div style={{ zIndex: 1 }}>{fog}</div>
          <div className={styles.rainbowContainer}>
              <div className={styles.rainbow}></div>
          </div>
          <div className={styles.rainbowSecondaryContainer}>
              <div className={styles.rainbow} style={{ opacity: 0.7 }}></div>     
          </div>
          <div style={{ zIndex: 4 }}>{rain}</div>
        </div>
      </div>
    );
});

AnimatedBackground.displayName = 'AnimatedBackground';
```

### 5. Primary Button (`frontend/src/components/ui/PrimaryButton.tsx`)

```tsx
import * as React from 'react';
import { Button, ButtonProps } from '@fluentui/react-components';

export const PrimaryButton: React.FC<ButtonProps> = ({ style, appearance = 'primary', ...props }) => {
  return (
    <Button
      appearance={appearance}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(var(--confirm-grad-1) / var(--confirm-grad-opacity)), rgba(var(--confirm-grad-2) / var(--confirm-grad-opacity)), rgba(var(--confirm-grad-3) / var(--confirm-grad-opacity)))',
        border: '1px solid rgba(255,255,255,0.28)',
        backdropFilter: 'blur(10px) saturate(120%)',
        WebkitBackdropFilter: 'blur(10px) saturate(120%)',
        ...style,
      }}
      {...props}
    />
  );
};

export default PrimaryButton;
```

## Execution Steps

1.  **Create/Update Styles**:
    *   Update `frontend/src/index.css` (or `globals.css`) with the provided CSS.
    *   Create `frontend/src/styles/themes.ts` with the adapted theme.
    *   Create `frontend/src/styles/useStyles.ts` with the provided hook.

2.  **Create Components**:
    *   Create `frontend/src/components/background/AnimatedBackground.tsx`.
    *   Create `frontend/src/components/ui/PrimaryButton.tsx`.

3.  **Integrate**:
    *   Modify `frontend/src/App.tsx` to wrap the application in the new `FluentProvider` (using `archerDarkTheme`) and include `AnimatedBackground`.
    *   Ensure the `mainUI` class from `useStyles` is applied to the content wrapper.
