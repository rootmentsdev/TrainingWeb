# LMS Web Color Scheme Guide

## Overview
The LMS Web application now uses a modern, consistent color scheme based on CSS custom properties (variables) for easy maintenance and customization.

## Color Palette

### Primary Colors - Teal Blue Theme
- **Primary Gradient**: `linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)`
- **Primary Start**: `#0ea5e9` (Sky Blue)
- **Primary End**: `#10b981` (Emerald Green)
- **Primary Light**: `#38bdf8` (Light Sky Blue)
- **Primary Dark**: `#0369a1` (Dark Sky Blue)

### Status Colors
- **Success**: `#10b981` (Emerald Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Pending**: `#6b7280` (Gray)

### Neutral Colors
- **Text Primary**: `#1a202c` (Dark Gray)
- **Text Secondary**: `#4a5568` (Medium Gray)
- **Text Muted**: `#718096` (Light Gray)
- **Text Light**: `#a0aec0` (Very Light Gray)

## CSS Variables Usage

### Basic Usage
```css
.my-element {
  background: var(--primary-gradient);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}
```

### Utility Classes
The color scheme includes pre-built utility classes:

#### Background Gradients
- `.bg-primary-gradient` - Primary teal-blue gradient
- `.bg-secondary-gradient` - Secondary amber gradient
- `.bg-success-gradient` - Success green gradient
- `.bg-warning-gradient` - Warning amber gradient
- `.bg-error-gradient` - Error red gradient

#### Text Colors
- `.text-primary` - Primary text color
- `.text-secondary` - Secondary text color
- `.text-muted` - Muted text color

#### Buttons
- `.btn-primary` - Primary button with hover effects
- `.btn-success` - Success button with hover effects
- `.btn-warning` - Warning button with hover effects
- `.btn-error` - Error button with hover effects

#### Status Badges
- `.badge-completed` - Completed status badge
- `.badge-in-progress` - In-progress status badge
- `.badge-not-started` - Not started status badge

#### Cards
- `.card` - Standard card with hover effects
- `.card-glass` - Glass morphism card effect

## Customization

### Changing the Primary Color
To change the primary color scheme, modify the CSS variables in `src/colors.css`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
  --primary-start: #your-color-1;
  --primary-end: #your-color-2;
  --primary-light: #your-light-color;
  --primary-dark: #your-dark-color;
}
```

### Adding New Color Schemes
You can create additional color schemes by adding new CSS variables:

```css
:root {
  /* Purple Theme */
  --purple-gradient: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  --purple-start: #8b5cf6;
  --purple-end: #a855f7;
  
  /* Orange Theme */
  --orange-gradient: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  --orange-start: #f97316;
  --orange-end: #ea580c;
}
```

## Component Integration

### Login Component
The login component uses the primary gradient background and glass morphism effects.

### Training Dashboard
The training dashboard uses:
- Primary gradient for headers and buttons
- Success gradient for completed items
- Warning gradient for in-progress items
- Error gradient for not-started items
- Glass morphism for cards and modals

## Best Practices

1. **Use CSS Variables**: Always use CSS variables instead of hardcoded colors
2. **Consistent Gradients**: Use the predefined gradients for visual consistency
3. **Accessibility**: Ensure sufficient contrast ratios for text readability
4. **Hover Effects**: Use the provided hover utility classes for interactive elements
5. **Status Colors**: Use the appropriate status colors for different states

## File Structure
```
src/
├── colors.css          # Main color scheme definitions
├── index.css           # Global styles with color variables
└── components/
    ├── Login.css       # Login component styles
    └── TrainingDashboard.css # Dashboard styles
```

## Migration Notes
- The old purple theme (`#667eea` to `#764ba2`) has been replaced with the new teal-blue theme
- All components now use CSS variables for consistent theming
- Glass morphism effects have been added for modern UI appearance
- Hover effects and animations have been standardized across components
