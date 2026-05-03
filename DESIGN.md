---
version: "1.0"
theme:
  colors:
    background:
      light: "hsl(0, 0%, 100%)"
      dark: "hsl(0, 0%, 0%)" # Pure Black
    foreground:
      light: "hsl(0, 0%, 9%)"
      dark: "hsl(0, 0%, 93%)" # Clean Gray
    primary:
      light: "hsl(0, 0%, 9%)"
      dark: "hsl(0, 0%, 98%)"
    card:
      light: "hsl(0, 0%, 100%)"
      dark: "hsl(0, 0%, 4%)"
    border:
      light: "hsl(0, 0%, 90%)"
      dark: "hsl(0, 0%, 15%)"
    destructive:
      value: "hsl(0, 84%, 60%)"
    status:
      pending: "hsl(38, 92%, 50%)"
      paid: "hsl(142, 76%, 36%)"
      delayed: "hsl(0, 84%, 60%)"
  typography:
    font_family:
      sans: "'Inter', system-ui, sans-serif"
      mono: "'JetBrains Mono', monospace"
  radii:
    base: "0.5rem"
    md: "calc(0.5rem - 2px)"
    sm: "calc(0.5rem - 4px)"
  shadows:
    glass: "0 8px 32px 0 rgba(31,38,135,0.37)"
  motion:
    fade_in: "0.3s ease-out"
    fade_in_up: "0.4s ease-out"
    scale_in: "0.2s ease-out"
    slide_in_right: "0.25s ease-out"
---

# Anti-Gravity Glassmorphism

The CampusLedger aesthetic bridges the gap between hyper-modern SaaS platforms (like Vercel) and highly interactive gaming-adjacent communities (like Discord). It relies on a high-contrast foundation with physics-driven spatial depth.

## Core Aesthetic Intent

The visual identity operates on the concept of **"Ethereal Suspension."** Interfaces should never feel like flat documents; instead, they should feel like floating panes of glass suspended in a deep, atmospheric void.

1.  **Pure Black Void Foundation:** The default global dark mode background is not a dark gray, but rather a pure black (`hsl(0, 0%, 0%)`) accented by a subtle, deep cyan radial gradient emitting from the top (`bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20`). This creates an immediate sense of endless depth.
2.  **Glassmorphic Elevations:** UI elements (like modals, chat windows, and the Club Hub) sit "above" this void using the `.glass` utility. This utility relies on severe backdrop blurring (`backdrop-blur-xl`), ultra-thin translucent borders (`border-white/10`), and a specific, slightly tinted shadow (`rgba(31,38,135,0.37)`) to simulate physical acrylic material.
3.  **High-Contrast Typography:** Text entirely abandons neon colors. Instead, it relies on sophisticated, stark contrast using clean whites (`hsl(0, 0%, 93%)`), bright metallic gradients (`.text-gradient`), and the incredibly crisp `Inter` font family. Data elements (like timestamps, transaction IDs, or currency) utilize `JetBrains Mono` for precise readability.

## Interaction & Motion

Motion in CampusLedger is physics-based, simulating spatial interaction rather than just linear fading.

*   **Entrance Physics:** Modals and new data rows should never simply appear. They must obey the `fade-in-up` or `scale-in` keyframes, starting slightly lower or smaller and snapping into their final resting place with an `ease-out` easing curve. This gives weight to the digital objects.
*   **Tilt Effects:** Key interactive elements (like Student Profile cards or Club Banners) utilize Framer Motion's `useTransform` and `useSpring` to create 3D tilt effects that respond dynamically to mouse movement, reinforcing the "physical" nature of the UI.

## Component Execution

*   **Status Pills:** Never use generic red/green/yellow blobs. Status badges use tightly controlled, high-saturation HSL values for the foreground text paired with extremely washed-out, low-opacity backgrounds of the same hue (e.g., `status-paid` text on `status-paid-bg`). This provides instant scannability without visual noise.
*   **Data Tables:** The `.table-wrapper` and `.table-th` utilities strip away all unnecessary lines. Tables rely on generous padding (`py-3.5`), muted uppercase tracking for headers, and subtle row hover states (`bg-accent/50`) rather than harsh gridlines.
*   **Forms & Inputs:** Inputs (`.input-field`) are stark and minimal. They sit flush with the background, revealing themselves only via a subtle `border-border`, and jump to attention with a sharp `ring-ring` (pure black/white) when focused. 

When extending CampusLedger, remember: **If it looks like a standard webpage, you've failed.** Every new screen must feel like a specialized, premium terminal floating in space.
