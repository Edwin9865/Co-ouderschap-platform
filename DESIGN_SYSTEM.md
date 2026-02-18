# CoParenting App - Design System

Dit document beschrijft het nieuwe design systeem voor de CoParenting app. Gebruik deze richtlijnen bij het ontwerpen van nieuwe pagina's of het updaten van bestaande pagina's.

## Kleurenschema

### Primaire Kleuren
- **Teal**: `teal-50` tot `teal-700` - Primaire actiekleuren
- **Emerald**: `emerald-50` tot `emerald-700` - Secundaire accent
- **Cyan**: `cyan-50` tot `cyan-700` - Tertiary accent

### Neutrale Kleuren
- **Gray**: `gray-50` tot `gray-900` - Tekst en borders
- **White**: `white` - Achtergronden en cards

### Accent Kleuren
- **Sky**: `sky-50` tot `sky-700` - Informatie
- **Amber**: `amber-500` - Reviews/ratings
- **Rose**: `rose-50` tot `rose-700` - Waarschuwingen/specials

## Toegankelijkheid (WCAG)

### Contrast Ratios
- Normale tekst: minimaal 4.5:1 contrast
- Grote tekst (18pt+): minimaal 3:1 contrast
- Interactieve elementen: duidelijk focus states

### ARIA Labels
- Alle buttons hebben aria-labels waar nodig
- Carousel navigatie heeft aria-current en aria-label
- Star ratings hebben aria-label beschrijvingen

### Keyboard Navigation
- Alle interactieve elementen zijn keyboard-accessible
- Tab order is logisch en intuïtief
- Focus states zijn duidelijk zichtbaar

## Typography

### Headings
- **H1**: `text-5xl sm:text-6xl lg:text-7xl font-extrabold` - Hero titles
- **H2**: `text-4xl sm:text-5xl font-extrabold` - Section titles
- **H3**: `text-xl font-bold` - Card titles

### Body Text
- **Large**: `text-xl leading-relaxed` - Introductie paragrafen
- **Normal**: `text-base leading-relaxed` - Standaard tekst
- **Small**: `text-sm` - Meta informatie

### Font Weights
- **Extrabold**: `font-extrabold` - Belangrijke headings
- **Bold**: `font-bold` - Sub-headings en emphasis
- **Semibold**: `font-semibold` - Meta informatie
- **Normal**: `font-normal` - Body tekst

## Spacing

### Padding
- **XL**: `p-8` - Grote cards en sections
- **Large**: `p-7` - Medium cards
- **Medium**: `p-6` - Kleine cards
- **Small**: `p-4` - Compacte elementen

### Margin/Gap
- **Section spacing**: `py-20` - Tussen grote sections
- **Card spacing**: `gap-8` - Grid gaps
- **Element spacing**: `gap-4` - Binnen componenten
- **Text spacing**: `mt-6`, `mb-3` etc - Tussen tekst elementen

## Border Radius

- **Cards**: `rounded-3xl` - Grote cards (24px)
- **Buttons**: `rounded-2xl` - Buttons en kleine cards (16px)
- **Icons**: `rounded-2xl` - Icon containers
- **Small elements**: `rounded-full` - Pills, dots

## Borders

- **Primary**: `border-2 border-gray-100` - Standaard cards
- **Accent**: `border-2 border-teal-200` - Highlighted cards
- **Subtle**: `border border-gray-200` - Zeer subtiel

## Shadows

- **Default**: `shadow-lg` - Standaard cards
- **Hover**: `hover:shadow-xl hover:shadow-2xl` - Interactieve hover states
- **Subtle**: `shadow-sm` - Kleine elementen

## Components

### Cards
```tsx
<div className="bg-white p-8 rounded-3xl border-2 border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all">
  {/* Content */}
</div>
```

### Primary Button
```tsx
<Link
  to="/path"
  className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
>
  Button Text
  <ArrowRight className="w-6 h-6" />
</Link>
```

### Secondary Button
```tsx
<Link
  to="/path"
  className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
>
  Button Text
</Link>
```

### Icon Container
```tsx
<div className="w-14 h-14 rounded-2xl border-2 border-teal-200 bg-teal-50 flex items-center justify-center">
  <Icon className="w-7 h-7 text-teal-600" />
</div>
```

### Feature Card
```tsx
<div className="bg-white p-8 rounded-3xl border-2 border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:border-teal-200">
  <div className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center mb-5 bg-teal-50 text-teal-700 border-teal-200">
    <Icon className="w-7 h-7" />
  </div>
  <h3 className="text-xl font-bold text-gray-900 mb-3">Title</h3>
  <p className="text-gray-600 leading-relaxed">Description</p>
</div>
```

## Gradients

### Backgrounds
- **Hero**: `bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50`
- **Section**: `bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50`
- **CTA**: `bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700`

### Buttons
- **Primary**: `bg-gradient-to-r from-teal-600 to-emerald-600`
- **Icon containers**: `bg-gradient-to-br from-teal-100 to-emerald-100`

### Text
- **Accent heading**: `text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600`

## Carousel Component

De homepage gebruikt een volledig toegankelijke carousel voor app screenshots:

### Features
- Auto-play (4 seconden per slide)
- Keyboard navigatie met pijl buttons
- Dot indicators met aria-labels
- Smooth transitions
- Pause on interaction
- Touch-friendly op mobiel

### Implementation
```tsx
<ScreenshotCarousel />
```

## Section Alternation

Wissel achtergrondkleuren af tussen sections:
1. Hero: Gradient background
2. Trust bar: `bg-white`
3. Features: `bg-gray-50`
4. Benefits: `bg-white`
5. How it works: Gradient background
6. Testimonials: `bg-white`
7. FAQ: `bg-gray-50`
8. CTA: Gradient background

## Responsive Design

### Breakpoints (Tailwind defaults)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### Common Patterns
- Grid layouts: `grid md:grid-cols-2 lg:grid-cols-3`
- Text sizes: `text-4xl sm:text-5xl lg:text-6xl`
- Spacing: `py-16 sm:py-20`
- Flex direction: `flex-col sm:flex-row`

## Hover Effects

Standaard hover patterns:
- **Cards**: `hover:shadow-xl hover:-translate-y-1 transition-all`
- **Buttons**: `hover:shadow-xl hover:-translate-y-0.5 transition-all`
- **Small elements**: `hover:scale-110 transition-all`

## Animations

Gebruik `transition-all` voor smooth animations:
- `duration-300` voor snelle interacties
- `duration-500` voor carousel slides
- `ease-out` voor natuurlijke beweging

## Content Tone

- **Professional maar toegankelijk** - Niet te corporate
- **Informatief maar niet opdringerig** - Feiten en voordelen, geen hype
- **Empathisch** - Begrijp de uitdaging van co-ouderschap
- **Actiegericht** - Duidelijke CTA's maar niet pushy

## Best Practices

1. **Consistentie**: Gebruik altijd dezelfde component patterns
2. **Spacing**: Behoud consistent spacing tussen secties
3. **Contrast**: Check altijd contrast ratios voor toegankelijkheid
4. **Mobile-first**: Design eerst voor mobiel, dan desktop
5. **Performance**: Optimaliseer images en lazy-load waar mogelijk
6. **Semantic HTML**: Gebruik correcte HTML5 tags (section, article, nav)
