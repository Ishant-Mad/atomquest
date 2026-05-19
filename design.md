---
name: AtomQuest
description: Enterprise-level goal setting and tracking
colors:
  primary: "oklch(0.65 0.15 250)"
  background: "oklch(0.15 0.01 250)"
  surface: "oklch(0.20 0.01 250)"
  success: "oklch(0.7 0.15 150)"
  warning: "oklch(0.7 0.15 50)"
  border: "oklch(0.25 0.01 250)"
typography:
  body:
    fontFamily: "var(--font-sans)"
rounded:
  lg: "0.625rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "oklch(0.98 0.01 250)"
    rounded: "{rounded.lg}"
---

# Design System: AtomQuest

## 1. Overview

**Creative North Star: "Enterprise Level Detail"**

This system is built to provide a high-contrast, self-explaining, and intuitive demo experience. The general feel is refreshing and tactile without being overwhelming. It completely rejects generic, cluttered HR interfaces and the trend of "AI slop dashboards."

**Key Characteristics:**
- Demo-optimized and highly visual
- Tactile, but refined and subtle
- Solarized/VS Code-like color palette
- Focused on absolute clarity over density

## 2. Colors

The palette leverages technical, VS Code/Solarized-inspired colors to establish trust and precision.

### Primary
- **Vibrant Solarized Blue** (oklch(0.65 0.15 250)): Primary actions, branding, and interactive highlights.

### Semantic
- **Success Green** (oklch(0.7 0.15 150)): On-track goals and completed items.
- **Warning Orange** (oklch(0.7 0.15 50)): At-risk items or rework required.

### Neutral
- **Deep Slate Void** (oklch(0.15 0.01 250)): App background.
- **Surface Slate** (oklch(0.20 0.01 250)): Cards and panels.
- **Subtle Border** (oklch(0.25 0.01 250)): Dividers and structural borders.

## 3. Typography

**Display Font:** Sans-serif
**Body Font:** Sans-serif
**Label/Mono Font:** Sans-serif

**Character:** Clean, legible, high-contrast, designed to make information readable at a glance.

### Hierarchy
- **Body** (regular, base size): General text and data tables.

## 4. Elevation

The system is generally flat, relying on color contrast and subtle borders (1px) over heavy drop shadows. Avoid nested cards completely.

## 5. Components

Components are very subtle and confident. They should feel tactile but remain restrained.

### Buttons
- **Shape:** 0.625rem radius
- **Primary:** Vibrant blue background with high-contrast text.

### Cards
- **Philosophy:** Used minimally, only to group top-level entities, never nested.

## 6. Do's and Don'ts

- **Do:** Ensure workflows are instantly comprehensible.
- **Do:** Make goal status immediately obvious.
- **Don't:** Build "AI slop dashboards" with endless nested cards.
- **Don't:** Rely on modals before trying inline forms.
