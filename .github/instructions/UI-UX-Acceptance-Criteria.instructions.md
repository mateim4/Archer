---
applyTo: '**'
---
The Definitive Standard for UI/UX and Frontend Design Acceptance Criteria: A Comprehensive Research Report
1. Introduction: The Strategic Imperative of Acceptance Criteria in Modern Frontend Engineering

The contemporary digital landscape is characterized by an unprecedented fragmentation of devices, browsers, and user contexts. In this environment, the traditional "redline" document or static design mock-up is woefully insufficient as a specification for high-quality software delivery. The bridge between the static intent of a designer and the dynamic reality of a frontend engineer is built upon Acceptance Criteria (AC). These criteria serve not merely as a checklist for completion but as the codified "Definition of Done" (DoD) that governs the functional, visual, and performant integrity of an application.  

The definition of acceptance criteria for User Interface (UI) and User Experience (UX) has evolved from simple visual verification—"does it look like the picture?"—to a complex, multi-dimensional matrix of requirements. This report establishes an exhaustive standard for Frontend Design Acceptance Criteria, synthesizing current industry best practices, Agile methodologies, and technical standards such as WCAG 2.2 and Core Web Vitals. The analysis indicates that a robust set of acceptance criteria must transcend the "pixel-perfect" paradigm to embrace "functional excellence," where the behavior of the interface under stress, error conditions, and varied accessibility contexts is as rigorously defined as the "happy path".  

1.1 The Operational Context: Agile and the Design-Dev Gap

In the context of Agile and Scrum methodologies, Acceptance Criteria serve as the "smallest unit of functional or design requirement" that allows a team to judge the completeness of a feature. They function as a contract between the Product Owner, the Designer, and the Developer. While the Definition of Done (DoD) applies globally to the increment—ensuring standards like testing and documentation are met—Acceptance Criteria are specific to individual User Stories.  

However, a critical gap often exists in frontend development: the "implicit" requirements. Designers rarely explicitly document that a button must have a focus state for keyboard users, or that a modal must trap focus. Developers, under time pressure, may default to browser standards which are often insufficient, leading to a degradation of the user experience. This report aims to convert these implicit expectations into explicit, testable criteria. By formalizing these expectations, organizations can mitigate the risks associated with the "handoff" phase, where ambiguity often results in technical debt and usability failures.  

1.2 The Economic Impact of Defined Criteria

The absence of detailed UI/UX acceptance criteria leads to significant rework and accumulated technical debt. Research suggests that when state definitions (hover, active, error, loading) are missing from the handoff, developers are forced to improvise. This improvisation leads to inconsistencies that are costly to remediate post-deployment. Furthermore, neglecting non-functional criteria such as performance thresholds (e.g., Largest Contentful Paint) and accessibility compliance (e.g., WCAG contrast ratios) results in a product that may look correct but fails to perform under real-world conditions, leading to user abandonment and potential legal liabilities.  

The establishment of a comprehensive set of acceptance criteria acts as a quality gate. It empowers Quality Assurance (QA) professionals to validate not just the functionality of the business logic, but the quality of the interaction itself. It transforms subjective feedback ("this feels slow") into objective, measurable data ("the INP metric exceeds 200ms").  

2. Visual Fidelity and Design System Integrity

The first tier of acceptance criteria addresses the visual fidelity of the implementation. While modern development moves away from rigid pixel perfection in favor of fluid responsiveness, the integrity of the design system—typography, spacing, and iconography—must be maintained to ensure brand consistency and readability.
2.1 Typography Standards and Vertical Rhythm

Typography is the structural foundation of the web, and its acceptance criteria must extend far beyond simple font-family selection to encompass rendering behavior, loading strategies, and fluid scaling.

Font Rendering and Smoothing: Acceptance criteria must specify that font-smoothing (antialiasing) is applied consistently. The rendering engines of macOS (Core Text) and Windows (DirectWrite) interpret font weights differently. A standard AC ensures that specific CSS properties (like -webkit-font-smoothing: antialiased) are used judiciously to align visual weight across platforms, preventing the text from appearing unexpectedly bold or thin on different operating systems.  

Responsive Typography and Scaling: Text size cannot be static in a multi-device world. ACs must define fluid scaling behavior. Modern implementations often use clamp() functions to smoothly transition font sizes between breakpoints without sudden jumps. The criteria must verify that text remains readable on mobile devices without requiring manual zooming, typically mandating a minimum font size of 16px for body text to prevent iOS from zooming in on input focus.  

Line-Height and Readability: The vertical rhythm of the page is dictated by line-height (leading). A common failure point is the use of default browser line-heights which often crowd text. Acceptance criteria must verify that line-height is proportional to the font size—standard guidelines suggest a ratio of 1.4 to 1.6 for body text to ensure readability, while headings may use tighter spacing (1.1 to 1.3). Furthermore, the criteria must check that line length (measure) is capped at 60-80 characters per line to prevent eye fatigue on wide screens.  

Web Font Loading and Performance: To prevent Cumulative Layout Shift (CLS), acceptance criteria must require specific font-display strategies. The use of font-display: swap or optional ensures that text is visible immediately (using a system fallback) while the custom web font loads. The AC should explicitly forbid "flash of invisible text" (FOIT) which blocks rendering and degrades the user experience. Additionally, the criteria should verify that font files are subsetted to include only necessary glyphs, reducing file size and improving load times.  

Character Support and Internationalization: For applications supporting internationalization, the AC must verify that the selected typeface supports all required character sets (glyphs). This prevents the appearance of "tofu" (empty box characters) when rendering languages with different scripts, such as Cyrillic, Greek, or Asian characters. The criteria should also mandate testing for Right-to-Left (RTL) layout support if languages like Arabic or Hebrew are supported, ensuring that text alignment and directionality flow correctly.  

2.2 The Spacing System and Spatial Logic

Inconsistent spacing is a primary indicator of a low-quality UI and often results from a lack of rigorous acceptance criteria regarding the spatial system.

Token-Based Spacing Implementation: A critical AC is the usage of design tokens (variables) for spacing rather than hard-coded magic numbers. Implementation should be verified against a defined scale (e.g., a 4px or 8px grid). The criteria is met when the computed styles match the design system tokens (e.g., margin-bottom: var(--space-4) which resolves to 16px) rather than arbitrary values like 17px or 19px. This ensures maintainability and consistency across the application.  

Container Padding and Safe Areas: Criteria must define how padding adjusts across breakpoints. A common failure in responsive design is retaining desktop-level padding (e.g., 64px) on mobile interfaces, which severely compresses the content area. The AC should specify distinct padding values for different viewports (e.g., 16px for mobile, 32px for tablet, 64px for desktop). Additionally, on mobile devices, the criteria must ensure compliance with "safe areas" (the notches and home indicator bars on modern phones), ensuring content is not obscured by hardware features.  

Component Independence: To ensure modularity, ACs must verify that components do not have external margins that affect their reusability. Spacing should be handled by the parent container or layout grid, not the component itself. A component should be self-contained; if it carries a margin-top of 20px, it becomes difficult to reuse in a context where flush alignment is required. The AC should mandate that components manage their internal padding, while the layout context manages the external margins (gap).  

2.3 Asset Management: Icons and Images

The handling of images and icons significantly impacts both visual quality and performance. Acceptance criteria must be rigorous regarding formats and attributes.

Resolution Independence (Vectors): All icons and UI controls must be rendered as SVGs (Scalable Vector Graphics) to ensure sharpness on high-DPI (Retina) displays. The AC should explicitly reject the use of raster formats (PNG/JPG) for iconography, as they pixelate upon scaling and typically carry a larger file size payload.  

Next-Generation Raster Formats: For photographic content, the AC should mandate modern formats. WebP or AVIF should be the primary delivery format, offering superior compression and quality compared to legacy formats. The criteria must verify that a fallback (typically JPEG) is provided for older browsers that do not support these newer standards, often implemented via the <picture> element.  

Art Direction and Responsive Images: The criteria must specify if images need to be cropped differently for mobile versus desktop. Using the <picture> element allows for "art direction," where a wide-angle shot is used for desktop and a zoomed-in crop focusing on the subject is used for mobile. The AC should verify that the correct image source is loaded based on the viewport width, rather than simply shrinking a large desktop image which wastes bandwidth.  

Alt Text and Accessibility Compliance: No image may be committed without a defined alt attribute. The AC serves as a strict gate here: decorative images must have alt="" to be ignored by screen readers, preventing auditory clutter. Informative images must have descriptive, succinct text defined in the criteria itself. This ensures that users relying on assistive technology receive the same context as visual users.  

3. Responsive and Fluid Design Methodology

The era of designing for specific devices (e.g., "iPhone view" or "iPad view") is obsolete. Modern acceptance criteria must mandate fluid design that works across a continuum of viewport sizes, utilizing content-driven breakpoints rather than device-specific ones.
3.1 Breakpoint Strategy: Content vs. Device

Standard ACs now favor content-driven breakpoints. A layout should "break" (change configuration) when the content no longer fits comfortably, rather than at an arbitrary pixel width associated with a specific phone model. This approach future-proofs the design against new devices with varying dimensions.  

The following table outlines the standard breakpoint tokens and their associated acceptance criteria for layout behavior:
Standard Breakpoint Token	Width Range (Typical)	Usage Context & Acceptance Criteria
xs (Mobile Portrait)	320px – 480px	

Single column layout. Navigation must collapse into a hamburger menu or bottom bar. Sidebars must be hidden or converted to off-canvas drawers. Font sizes base at 16px.
sm (Mobile Landscape)	481px – 768px	

Fluid grids. Layouts may shift to 2-column if cards are small. Navigation typically remains collapsed. Ensure modal dialogs do not exceed viewport height.
md (Tablet/Laptop)	769px – 1024px	

Transition zone. Navigation expands to horizontal links. Layouts shift to 3-column grids. Sidebars may become visible or toggleable.
lg (Desktop)	1025px – 1440px	

High-density. Full dashboard views. All secondary information (sidebars, panels) is visible by default. Hover interactions are enabled.
xl (Ultra-Wide)	1441px+	

Constrained width. Main content container has a max-width (e.g., 1440px) and is centered to prevent content from stretching indefinitely and destroying line length readability.
 
3.2 Responsive Behavior Checklist

Horizontal Scroll Prohibition: A critical "fail" condition for any responsive AC is the presence of an unintentional horizontal scrollbar on mobile devices. This is typically caused by fixed-width elements (like images or ads) overflowing the viewport. The criteria must state that overflow-x: hidden should be used on the body, but root causes must be addressed by ensuring all child elements have max-width: 100%.  

Touch Target Size Compliance: On mobile breakpoints (touch devices), all interactive elements must have a minimum tappable area. The AC must align with WCAG 2.2 Target Size (Minimum) criteria, requiring a target of at least 24x24 CSS pixels, though best practices typically mandate 44x44 CSS pixels (iOS standard) or 48x48 dp (Android standard). This ensures that users with larger fingers or motor impairments can successfully interact with the UI.  

Responsive Data Tables: Data tables present a unique challenge on small screens. The AC must define a specific behavior for tables on mobile. Options include:

    Horizontal Internal Scroll: The table remains wide but sits within a scrollable container.

    Card View: Each row transforms into a vertical card layout.

    Column Hiding: Non-essential columns are hidden, with an option to expand details. The choice must be explicit in the AC to prevent broken layouts.   

Orientation Resilience: The UI must survive a rotation from portrait to landscape without losing user input or context. Acceptance criteria should verify that modals and overlays remain accessible even when vertical height is severely reduced in landscape mode. Often, this requires switching from a centered modal to a full-screen modal or allowing the modal body to scroll independently of the header/footer.  

4. Component Interaction and State Management

A static design usually depicts a component in its "Rest" state. However, a user interacts with the component through a lifecycle of states. A robust Definition of Done requires that all states are designed, implemented, and verified to ensure the interface feels alive and responsive.  

4.1 The Interactive State Matrix

For every interactive element (button, input, link, card), the following states must be verified against the AC:

    Default (Rest): The standard appearance when no interaction is occurring.

    Hover (Pointer): Visual feedback when the mouse cursor is over the element.

        AC Requirement: The change must be sufficient to be noticed but not distracting. It must not rely solely on color change; consider scale, underline, or border changes to aid colorblind users. The AC should also specify that hover states must not be triggered on touch devices, where the "hover" often sticks after a tap.   

Focus (Keyboard/Input): The state when selected via Tab key or assistive technology.

    AC Requirement: The browser default outline is often insufficient or inconsistent. A custom, high-contrast focus ring (min 3:1 contrast against adjacent colors) is required.

    AC Requirement: Focus must never be obscured by sticky headers or other overlays. The AC must verify that scrolling automatically adjusts to keep the focused element in view.   

Active (Pressed): The state during the split-second of a click or tap.

    AC Requirement: This state provides essential tactile feedback that the system received the input. It often involves a darker color or a slight depression (scale down) effect.   

Disabled: The state when interaction is forbidden due to system logic.

    AC Requirement: Disabled elements must be visually distinct (often grayed out) but still legible. Note that while WCAG does not strictly require high contrast for disabled elements, best practice suggests maintaining readability.

    AC Requirement: Disabled controls must not be focusable via keyboard to prevent confusion. If a user tabs through a form, they should skip over disabled fields.   

Loading (Process): The state after interaction but before completion.

    AC Requirement: The button or control should prevent double-submission (e.g., become disabled or show a spinner) immediately upon activation. This prevents users from clicking "Pay" twice due to network latency.   

4.2 Loading Patterns: Skeletons vs. Spinners

The choice of loading state significantly affects Perceived Performance. Acceptance criteria must dictate the appropriate pattern based on the expected wait time and context.

Skeleton Screens: These are the preferred AC standard for initial page loads or heavy content areas (e.g., dashboards, feeds). They mimic the layout structure using gray placeholders, reducing cognitive load and the feeling of waiting by indicating that progress is happening and layout stability is imminent.  

    AC Check: Skeleton animations (shimmer) must utilize prefers-reduced-motion queries to disable the pulsing effect for users sensitive to motion.   

Spinners/Loaders: These should be reserved for small, localized actions (e.g., submitting a form, loading a specific widget) where the wait time is indeterminate but expected to be short (< 2 seconds).

    AC Check: Spinners must be centered within their container and must not shift the layout of surrounding elements.   

Labor Illusion and Progress Bars: For processes taking 2-10 seconds, the AC should require a deterministic progress bar or textual status updates ("Uploading...", "Processing...") rather than a looping spinner. Research suggests that providing a visual indicator of work (the "labor illusion") increases user value perception and tolerance for waiting. The AC should forbid the use of "fake" progress bars that stall at 99%, as this erodes trust.  

4.3 Empty States and Zero Data

An often-overlooked AC is the "Zero Data" state. A blank screen is a UX failure; it suggests the system is broken or the data failed to load.

Guidance over Emptiness: An empty state must be an active design element. The AC requires:

    Visual Indicator: An illustration or icon to visually indicate "emptiness" and differentiate it from a loading state.

    Explanatory Copy: Clear text explaining why it is empty (e.g., "No tasks found" vs "You haven't created any tasks yet").

    Call to Action (CTA): A primary path to rectify the emptiness (e.g., "Create your first task" button). This turns a dead-end into an onboarding opportunity.   

Contextual Help: In complex applications, the empty state should link to documentation or tutorials, guiding the user on how to populate the view. The AC should verify that these links are functional and relevant to the specific context of the empty container.  

5. Input, Forms, and Validation Logic

Forms are the primary mechanism for user input and arguably the most error-prone component of any UI. The AC for forms must be rigorous to prevent data loss, ensure data integrity, and minimize user frustration.
5.1 Validation Behavior: Inline vs. Submit

The timing of validation is critical. Research indicates different strategies for different contexts.  

Inline Validation (Real-Time):

    Requirement: Critical fields (username availability, password strength) should validate inline as the user types or upon losing focus.

    Debounce Logic: The AC must require "debounce" logic (e.g., 500ms delay). Validation should not trigger on every keystroke, which causes flashing error messages while the user is still typing valid characters. It should wait until the user pauses or leaves the field (onBlur).   

Success States: The AC should include "positive reinforcement" (e.g., a green checkmark) for valid inputs in long complex forms, giving the user a sense of progression and confidence.  

On-Submit Validation:

    Requirement: For simple fields or bulk inputs, validation can occur on submit to reduce visual noise. However, if an error is found, the AC must require that the focus is programmatically moved to the first invalid field, allowing the user to fix it immediately without searching.   

5.2 Error Handling and Messaging

Clarity and Proximity: Error messages must be located adjacent to the field in error (typically below the input). The AC must reject forms that only show a generic "Form has errors" message at the top of the page without highlighting specific fields.

Descriptive Text: Generic messages like "Invalid input" are a fail condition. The AC must require specific instructions, e.g., "Password must contain at least one number" or "Email address is missing the @ symbol." This aligns with Usability Heuristic #9: Help users recognize, diagnose, and recover from errors.  

Accessibility of Errors: The error message container must have role="alert" or be programmatically associated with the input using aria-describedby. This ensures that screen readers announce the error description immediately when the user focuses on the invalid field. Visual cues (red border) must be accompanied by text or icons to satisfy the "Color Reliance" accessibility criterion.  

5.3 Input Mechanics and Autocomplete

Input Types: The AC must verify the correct HTML5 input type is used to trigger the appropriate mobile keyboard.

    type="email": Triggers keyboard with @ and .com.

    type="tel": Triggers numeric keypad.

    type="number": Triggers number pad (and enforces numeric validation). Failure to use these types results in a subpar mobile experience where users must switch keyboard layers manually.   

Autocomplete Attributes: For personal data (name, address, credit card), the autocomplete attribute must be correctly implemented (e.g., autocomplete="given-name", autocomplete="shipping postal-code"). This allows browser autofill to function, significantly reducing user effort and transcription errors. This is also a requirement under WCAG 2.2 criteria regarding Redundant Entry.  

6. Accessibility (A11y) and Inclusive Design

Accessibility is a legal, ethical, and functional requirement. The Acceptance Criteria regarding A11y must align with WCAG 2.2 Level AA standards. This section details the specific checks required to ensure inclusivity.
6.1 Semantic Structure and Navigation

Landmarks: The page must use semantic regions (<header>, <nav>, <main>, <footer>, <aside>) to allow screen reader users to jump between sections. The AC should explicitly forbid the use of <div> for these structural elements. A screen reader user should be able to navigate the entire page structure using landmark shortcuts.  

Heading Hierarchy: Headings (<h1> through <h6>) must follow a strict logical order without skipping levels (e.g., jumping from <h1> to <h3>). This creates the "outline" of the page for non-visual users. The AC must state that visual styling (making text big) does not substitute for semantic heading tags.  

Skip Links: A "Skip to Main Content" link must be the first focusable element on the page. This link should be visually hidden until focused, at which point it becomes visible. This allows keyboard users to bypass repetitive navigation menus and get straight to the primary content, a critical requirement for usability.  

6.2 Focus and Keyboard Operability

No Mouse Dependency: Every interactive element must be operable via keyboard. The AC test requires unplugging the mouse and completing all core tasks using only Tab, Enter, Space, and Arrow keys. Any functionality that requires "dragging" (like a map or slider) must have a button-based alternative (e.g., +/- zoom buttons).  

Focus Trapping (Modals): When a modal dialog opens, specific focus management rules apply:

    Entry: Focus must move into the modal (usually to the first input or the close button).

    Trap: Focus must be trapped within the modal. Pressing Tab repeatedly should cycle through the modal's controls, never moving to the background page.

    Exit: Closing the modal (via Esc key or Close button) must return focus to the element that triggered the modal. This preserves the user's place in the interface.   

Focus Appearance: WCAG 2.2 introduces "Focus Appearance," requiring focus indicators to have a contrast ratio of at least 3:1 against the background and a minimum size. The AC must reject default browser outlines if they do not meet this contrast threshold on the specific background color used in the design.  

6.3 Color and Contrast

Text Contrast: Normal text must have a 4.5:1 contrast ratio against the background. Large text (18pt+ or 14pt bold) needs 3:1. The AC should specify that these ratios must be verified using tools like the WebAIM Contrast Checker. This applies to text on images as well, often requiring a semi-transparent overlay to ensure compliance.  

Non-Text Contrast: UI components (input borders, icons, progress bars) and graphical objects must have a 3:1 contrast ratio against adjacent colors. This ensures that a user can perceive the boundaries of a button or input field. The AC must verify that the active state of a component is distinguishable from the inactive state by more than just color.  

Dark Mode Support: If the application supports Dark Mode, all contrast checks must be re-validated in the dark theme. The AC should explicitly state that inverted colors must maintain the same hierarchy and legibility. It is insufficient to simply invert colors programmatically; manual tuning is often required to prevent "vibrating" high-contrast colors (e.g., pure white on pure black) which can cause eye strain.  

6.4 User Preferences and Motion

Reduced Motion: The UI must respect the operating system's prefers-reduced-motion setting.

    AC Requirement: If this setting is enabled, all non-essential movement (parallax scrolling, zooming effects, sliding cards, auto-playing videos) must be disabled or replaced with simple cross-fades. This protects users with vestibular disorders from experiencing nausea or dizziness.   

High Contrast Mode: The application must respond correctly to Windows High Contrast Mode (or similar OS settings). The AC should verify that background images and shadows are removed and that system colors are respected, ensuring maximum legibility for users with severe visual impairments.  

7. Performance Standards and Core Web Vitals

Performance is a fundamental component of User Experience. A slow interface is perceived as broken, regardless of its visual design. Acceptance criteria must define hard thresholds for loading and responsiveness, utilizing the Core Web Vitals framework.
7.1 Core Web Vitals Benchmarks (2025 Targets)

The report adopts Google's Core Web Vitals as the gold standard for performance acceptance criteria. These metrics correlate directly with user engagement and search ranking.  

Metric	Measurement Focus	Good Threshold	Needs Improvement	Poor Threshold
LCP (Largest Contentful Paint)	Perceived Loading Speed	≤ 2.5s	≤ 4.0s	> 4.0s
INP (Interaction to Next Paint)	UI Responsiveness	≤ 200ms	≤ 500ms	> 500ms
CLS (Cumulative Layout Shift)	Visual Stability	≤ 0.1	≤ 0.25	> 0.25

LCP Criteria (Loading Speed): The largest visual element (hero image, heading, or main text block) must render within 2.5 seconds on a slow 4G network. ACs should require specific technical implementations to meet this:

    Image optimization (WebP/AVIF).

    Server-side rendering (SSR) or Static Site Generation (SSG) for the initial view.

    Preloading critical assets (<link rel="preload">).   

INP Criteria (Responsiveness): INP replaces the older FID (First Input Delay) metric. It measures the latency of all interactions throughout the page lifecycle. The AC requires that complex JavaScript tasks (like filtering a large list or processing a form) must yield to the main thread frequently.

    AC Requirement: Visual feedback for any click (e.g., button active state) must appear within 200ms. Long tasks must be broken up or offloaded to Web Workers.   

CLS Criteria (Visual Stability): Elements must not jump around as the page loads. This causes user frustration (e.g., clicking the wrong button because it moved).

    AC Requirement: All images and ads must have explicit width and height attributes (or CSS aspect-ratio) reserved in the layout before the asset loads.

    AC Requirement: Dynamic content (like banners) must push content down only if initiated by user interaction; otherwise, it must overlay or reserve space.   

7.2 Resource Loading and Optimization

Code Splitting: The AC must mandate that JavaScript bundles are split by route. A user visiting the "Home" page should not download the code for the "Settings" page. This reduces the initial payload size and improves LCP.

Lazy Loading:

    Images: Off-screen images must use loading="lazy" to prevent them from competing for bandwidth with critical resources.

    Components: Heavy components (like maps or rich text editors) should be lazy-loaded only when they scroll into view or are interacting with.   

8. Cross-Platform and Browser Compatibility

The definition of "supported" must be explicit. "Works on my machine" is not a valid acceptance criterion. The AC must define the exact matrix of browsers and devices that must be verified.
8.1 The Browser Support Matrix

The AC must list specific versions. A typical Enterprise support matrix for 2025 includes the following requirements :  

    Chrome/Edge (Chromium): Support for the last 2 major versions. This covers the vast majority of desktop users.

    Firefox (Gecko): Support for the last 2 major versions plus the latest ESR (Extended Support Release), which is common in corporate environments.   

Safari (WebKit): Support for the last 2 major versions on both macOS and iOS. Safari often has unique rendering quirks (especially with Flexbox and Grid) that require specific testing.

Mobile Browsers:

    iOS: Safari (latest and previous major version).

    Android: Chrome (default) and Samsung Internet (widely used on Samsung devices).   

8.2 Degradation Strategy

Graceful Degradation: The AC should specify that while the application must function on older browsers (if supported), it does not need to look identical.

    AC Requirement: Cosmetic features (like glassmorphism backdrop-filter or complex CSS Grid animations) may degrade to simpler, functional fallbacks on browsers that do not support them. For example, a blurred background may become a solid opaque color. The core functionality must remain intact.   

9. Comprehensive Frontend Acceptance Criteria Checklist

The following section consolidates the research into a structured, actionable checklist. This list is designed to be copied, customized, and applied to User Stories as the standard "Definition of Done" for frontend tasks.
9.1 Global UI/UX Acceptance Criteria

    [ ] Design System Compliance: Typography, colors, and spacing match the established Design System tokens. No "magic values" (e.g., margin: 13px) are present in the CSS.   

[ ] Favicon & Page Title: The page title is descriptive (Page Name - App Name) and unique for every view. A valid favicon is present.  

[ ] 404/Error Pages: Custom error pages exist for 404 and 500 errors, providing a clear path back to the home page or dashboard.  

[ ] Print Styles: (If applicable) Printing the page results in a clean layout—navigation is hidden, background colors are removed, and text is black on white.  

9.2 Navigation & Structure

    [ ] Active State Indication: The current page/section is visually highlighted in the navigation menu and programmatically indicated using aria-current="page".   

[ ] Sticky Element Behavior: Sticky headers/footers do not obscure content or focus targets on small screens. They typically unstick or shrink on mobile landscape views.  

[ ] Breadcrumbs: Breadcrumb navigation exists for deep hierarchies, reflecting the user's path or site structure, and is fully navigable via keyboard.  

9.3 Images & Media

    [ ] Fluid Responsiveness: Images scale within their containers (max-width: 100%) and never cause horizontal scrolling.

    [ ] Modern Formats: Images are served in WebP/AVIF with JPEG/PNG fallbacks for legacy support.

    [ ] Lazy Loading: Off-screen images use loading="lazy" to improve LCP, while above-the-fold images are eager loaded.   

[ ] Alt Text: All images have appropriate text alternatives. Decorative images have alt="".  

9.4 Forms & Interaction

    [ ] Logical Tab Order: Tabbing follows a logical visual flow (Left->Right, Top->Bottom). No focus jumps occur.   

[ ] Validation Association: Errors appear clearly associated with the invalid field and are announced by screen readers.

[ ] Button States: All buttons have verified Default, Hover, Focus, Active, Disabled, and Loading states.  

[ ] Click Areas: All clickable elements are at least 44x44px (or have padding to achieve this effective size).  

[ ] Input Types: Mobile keyboards are triggered correctly (Email, Number, Tel).  

9.5 Accessibility (Critical)

    [ ] Keyboard Trap Prevention: No component traps the keyboard focus (unless it is a modal/dialog).   

[ ] ARIA Patterns: All custom widgets (dropdowns, toggles) use correct ARIA patterns (e.g., aria-expanded, aria-selected).  

[ ] Zoom Capability: The layout remains functional and legible when the browser is zoomed to 200%.  

[ ] No Color Reliance: Information is not conveyed by color alone (e.g., error fields have an icon or text, not just a red border).  

9.6 Performance

    [ ] LCP: < 2.5 seconds on 4G networks.

    [ ] CLS: < 0.1 score (no visual jumping).

    [ ] INP: < 200ms for all interactions.

    [ ] Code Splitting: JavaScript bundles are split; only necessary code is loaded for the current route.

10. Conclusion and Strategic Insights

Defining comprehensive Acceptance Criteria is a strategic investment in product quality. The research demonstrates that "Done" is not a singular point in time but a composite state of visual accuracy, functional robustness, and inclusive accessibility.

The Shift to Engineering QA: The industry is shifting away from "Visual QA" (does it look right?) toward "Engineering QA" (does it work right?) as the primary driver of frontend quality. Tools like automated accessibility checkers (Axe), visual regression testing (Percy/Chromatic), and performance monitoring (Lighthouse CI) are now essential to verifying these criteria at scale. The ACs defined in this report act as the configuration logic for these tools.

Mobile-First is Now "Mobile-Mandatory": The expansion of WCAG 2.2 into mobile-specific criteria (Target Size, Dragging Movements) implies that desktop-first acceptance criteria are now obsolete. A "Mobile-First" definitions approach is the only viable path to compliance and user satisfaction in 2025. The acceptance criteria regarding touch targets and orientation are not optional enhancements but fundamental requirements for a usable web.

By adopting this rigorous breakdown of criteria, teams can eliminate the ambiguity that causes rework, ensuring that every delivered feature is robust, inclusive, and performant by default. This document serves as the foundational "Definition of Done" for any high-quality frontend engineering team.