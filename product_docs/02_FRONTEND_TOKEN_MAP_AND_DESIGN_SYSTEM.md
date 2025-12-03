# 2. Frontend Token Map and Design System

## Design System: "Acrylic" (Purple Glass)
A modern, glassmorphism-based design system built on top of Fluent UI 2 tokens.

### Core Design Tokens (CSS Variables)

#### Backgrounds & Glass
| Token | Value | Usage |
| :--- | :--- | :--- |
| `--glass-bg` | `rgba(255, 255, 255, 0.1)` | Base layer for cards/panels |
| `--glass-border` | `rgba(255, 255, 255, 0.2)` | Subtle borders for depth |
| `--glass-shadow` | `0 8px 32px 0 rgba(31, 38, 135, 0.37)` | Deep shadow for elevation |
| `--acrylic-blur` | `backdrop-filter: blur(12px)` | The "frosted glass" effect |

#### Typography
*   **Font Family:** Poppins (Primary), Montserrat (Secondary).
*   **Scale:** Follows Fluent UI 2 ramp (Body1, Subtitle2, Title1, etc.).

#### Color Palette (Gradients)
*   **Primary Gradient:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (Deep Purple/Blue)
*   **Success:** `#10b981` (Emerald)
*   **Warning:** `#f59e0b` (Amber)
*   **Error:** `#ef4444` (Red)

### Component Library (`src/components/ui`)

#### 1. `GlassmorphicLayout`
The main wrapper for all views.
*   **Props:** `children`, `className`.
*   **Behavior:** Provides the animated gradient background and central glass container.

#### 2. `PurpleGlassCard`
Standard container for content.
*   **Variants:** `default`, `interactive`, `elevated`.
*   **Props:** `glass` ('light', 'medium', 'heavy').

#### 3. `PurpleGlassButton`
*   **Variants:** `primary` (Gradient), `secondary` (Glass), `ghost`.
*   **States:** Hover (glow effect), Active (scale down), Disabled (opacity).

#### 4. `PurpleGlassInput` / `PurpleGlassDropdown`
Form elements with transparent backgrounds and bottom-border focus states.

### Animation System
*   **`AnimatedBackground`**: Floating orbs/gradients in the background.
*   **Transitions:** All interactive elements have `transition: all 0.2s ease-in-out`.
*   **Page Transitions:** Framer Motion (planned) or CSS keyframes for view switching.

### Usage Guidelines
1.  **Depth:** Use `glass="heavy"` for modals, `glass="medium"` for main cards, `glass="light"` for secondary elements.
2.  **Contrast:** Ensure text is always legible against the variable background (use `text-white` or high-contrast darks depending on theme).
3.  **Spacing:** Use Fluent UI spacing tokens (`tokens.spacingHorizontalM`, etc.).
