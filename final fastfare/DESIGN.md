# Design System Specification

## 1. Overview & Creative North Star: "The Kinetic Velocity"

This design system is engineered to transform the industrial complexity of warehouse management into a high-end, editorial experience. Logistics is often cluttered and utilitarian; we are moving in the opposite direction. 

Our Creative North Star is **"The Kinetic Velocity."** This concept treats data as a fluid element moving through a structured, architectural space. We avoid the "template" look by utilizing intentional asymmetry, expansive breathing room, and a sophisticated layering of surfaces. This system doesn't just display information—it curates it. We prioritize a "software-as-a-service" aesthetic that feels as premium as a luxury lifestyle brand, ensuring that high-speed logistics feels controlled, precise, and effortless.

---

## 2. Color Theory & Surface Architecture

The palette is anchored by a high-octane **Primary Blue (#004ce1)**, representing speed and reliability. This is balanced by a deep **Secondary Amber (#954400)** for critical alerts and a refined **Tertiary Plum (#8f3986)** for specialized data categorization.

### The "No-Line" Rule
To maintain a modern, "editorial" feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through background color shifts or tonal transitions.
- Use `surface-container-low` (#eef1f3) for the main body area.
- Use `surface-container-lowest` (#ffffff) for primary content cards to create natural separation.
- Vertical and horizontal rhythm should be defined by the Spacing Scale, not lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the `surface-container` tiers to create depth:
1.  **Base Layer:** `surface` (#f5f7f9)
2.  **Section Layer:** `surface-container-low` (#eef1f3)
3.  **Component Layer (Cards/Panels):** `surface-container-lowest` (#ffffff)
4.  **Interaction Layer (Pop-overs):** `surface-container-highest` (#d9dde0)

### The "Glass & Gradient" Rule
For floating elements (modals, tooltips, or top-level navigation), use **Glassmorphism**. Apply a semi-transparent `surface-container-lowest` with a `backdrop-blur`. 
**Signature Textures:** Main CTAs should utilize a subtle linear gradient from `primary` (#004ce1) to `primary_container` (#809bff) to provide "soul" and dimension that flat color cannot provide.

---

## 3. Typography: Architectural Precision

We utilize a dual-font strategy to balance character with readability.

-   **Display & Headlines (Manrope):** The "Architectural" font. Manrope’s geometric shapes provide a professional, modern authority. Use `display-lg` to `headline-sm` for high-level data summaries and page titles.
-   **Body & Labels (Inter):** The "Precision" font. Inter is used for all functional data. Its high x-height ensures readability in dense warehouse manifests.

**Hierarchy Guidance:**
-   **Lead with Scale:** Use `display-md` (2.75rem) for hero metrics (e.g., "Total Shipments") to create a clear entry point.
-   **Secondary Data:** Use `label-md` (0.75rem) for metadata (e.g., SKU numbers or timestamps) using `on_surface_variant` (#595c5e) to recede visually.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are replaced by **Tonal Layering**.

-   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. The subtle shift from #ffffff to #eef1f3 creates a soft, natural lift.
-   **Ambient Shadows:** For floating action buttons or modal dialogs, use extra-diffused shadows. 
    -   *Shadow Color:* Tinted `on-surface` (#2c2f31) at 5% opacity. 
    -   *Blur:* 30px–40px.
-   **The "Ghost Border" Fallback:** If accessibility requirements demand a border, use the `outline_variant` (#abadaf) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Cards & Manifests
-   **Radius:** Always use `xl` (1.5rem) for main dashboard cards and `lg` (1rem) for nested items.
-   **Structure:** Forbid divider lines. Use `8` (1.75rem) or `10` (2.25rem) spacing units to separate list items.
-   **Hover State:** Shift background from `surface-container-lowest` to `surface-bright`.

### Buttons
-   **Primary:** `primary` (#004ce1) fill with `on_primary` (#f2f2ff) text. Use `full` roundedness (9999px) for a modern, "pill" aesthetic.
-   **Secondary:** `surface-container-high` (#dfe3e6) fill with `on_surface` (#2c2f31) text. No border.

### Status Chips
-   **Pending:** `secondary_container` (#ffc5a5) background with `on_secondary_container` (#763500) text.
-   **In Transit:** `primary_container` (#809bff) background with `on_primary_container` (#001c60) text.
-   **Shape:** Use `md` (0.75rem) roundedness to distinguish from the "pill" style buttons.

### Data Grids (Warehouse Inventory)
-   **Header:** Use `label-md` in `on_surface_variant`. 
-   **Rows:** Instead of lines, use a subtle `surface-container-low` background on every other row (Zebra striping) or simply rely on the Spacing Scale (unit `4`).

---

## 6. Do's and Don'ts

### Do
-   **DO** use whitespace as a functional tool. If a layout feels cluttered, increase the spacing unit rather than adding a divider.
-   **DO** use `surface_tint` to subtly color-code different warehouse zones or priority levels.
-   **DO** ensure all interactive elements have a minimum touch/click target of 44px, even if the visual element (like a small icon) is smaller.

### Don't
-   **DON'T** use pure black (#000000) for text. Always use `on_surface` (#2c2f31) to maintain a premium, soft-contrast look.
-   **DON'T** use the `error` color (#b41340) for anything other than critical system failures or high-risk warnings.
-   **DON'T** mix roundedness values haphazardly. Stick to `xl` for containers and `full` for interactive controls to maintain the "Kinetic Velocity" rhythm.