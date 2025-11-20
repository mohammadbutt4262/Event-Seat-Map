# Interactive Event Seating Map — Frontend

A high-performance React + TypeScript application for browsing and selecting seats in an event venue. Users can click or navigate with keyboard to select up to 8 seats, see live pricing updates, and persist their selection across page reloads.

## Features

### Core Requirements 
- **Venue Data Loading**: Loads venue layout from `public/venue.json` with multiple sections, rows, and seats
- **Interactive Seating**: Click-to-select seats; visual feedback for available, reserved, sold, and held statuses
- **Seat Selection**: Up to 8 seats can be selected; displays live subtotal and seat details
- **Keyboard Navigation**: Arrow keys to navigate, Enter/Space to select, Home/End for first/last seat
- **Seat Details Panel**: Shows section, row, seat ID, column, price tier, and status
- **Summary Bar**: Displays selected seat count, subtotal pricing, and individual seat prices
- **Persistence**: Selection is saved to `localStorage` and restored on page reload
- **Accessibility**:
  - ARIA labels on interactive elements
  - Focus indicators with keyboard navigation support
  - Semantic HTML structure
  - Keyboard shortcuts guide displayed in UI
- **Responsive Design**: Works on desktop and mobile viewports using CSS Grid and media queries

### Performance Optimization 
- **Canvas Rendering**: Uses HTML5 Canvas for efficient seat rendering (~60 fps)
- **Spatial Hashing**: Implements grid-based spatial indexing (64px buckets) for O(1) seat lookup on click
- **Memoization**: Sorts seat IDs once using `useMemo` to avoid unnecessary recalculations
- **Efficient Re-renders**: Only canvas redraws on state changes; component memoization prevents unnecessary child renders

### Stretch Goals Implemented
- **Dark Mode**: CSS custom properties with `prefers-color-scheme` media query support
- **Responsive Grid Layout**: Sidebar collapses on mobile; map takes full width below 768px
- **Price Tier System**: 4 price tiers with configurable pricing; easily extensible via `pricing.ts`

## Architecture & Trade-offs

### Design Decisions

1. **Canvas vs SVG**
   - **Choice**: HTML5 Canvas with 2D context
   - **Rationale**: Better performance for 15,000+ seats; imperative drawing is faster than DOM manipulation
   - **Trade-off**: Canvas doesn't integrate with React's virtual DOM, requiring manual ref handling and imperative redraw calls

2. **State Management**
   - **Choice**: React hooks (useState, useContext) + localStorage
   - **Rationale**: No external state library needed for this scope; localStorage provides simple persistence
   - **Trade-off**: localStorage serialization may lag with very large selections; could upgrade to IndexedDB for scale

3. **Spatial Indexing**
   - **Choice**: Grid-based spatial hash (64px buckets)
   - **Rationale**: O(1) average lookup time for seat hit detection; simple to implement and maintain
   - **Trade-off**: Assumes uniform seat distribution; adaptive bucket sizing would improve worst-case performance

4. **Component Structure**
   - **Choice**: Separated concerns (SeatCanvas, SeatDetails, SummaryBar, KeyboardNavigator)
   - **Rationale**: Maintainable, testable, and follows single responsibility principle
   - **Trade-off**: Light prop drilling; could use Context API to reduce prop passing

5. **Styling**
   - **Choice**: Plain CSS with CSS custom properties (CSS variables)
   - **Rationale**: No build-time overhead; dark mode support via native browser API
   - **Trade-off**: No CSS-in-JS scoping; global namespace requires careful naming (BEM-style)

## File Structure

```
src/
├── App.tsx                 # Main component: orchestrates state and layout
├── main.tsx               # React 19 root render
├── styles.css             # Global styles, responsive design, accessibility
├── types.ts               # TypeScript interfaces (Seat, Venue, etc.)
├── components/
│   ├── SeatCanvas.tsx     # Canvas-based seat renderer with pointer handling
│   ├── SeatDetails.tsx    # Displays selected seat metadata
│   ├── SummaryBar.tsx     # Shows selection count, subtotal, seat list
│   └── KeyboardNavigator.tsx # Keyboard event handler and nav guide
├── hooks/
│   └── useSelection.ts    # Custom hook: manages selected seats + localStorage
└── utils/
    ├── venueLoader.ts     # Loads & flattens venue.json
    ├── spatialHash.ts     # Spatial indexing grid for seat queries
    └── pricing.ts         # Price tier mapping and formatting
public/
└── venue.json            # Venue layout data (3 sections, 10 seats total demo)
```

## Running the Application

### Prerequisites
- Node.js 18+ and pnpm (or npm/yarn)

### Development
```bash
pnpm install
pnpm dev
```
Starts Vite dev server at `http://localhost:5173`

### Build for Production
```bash
pnpm build
pnpm preview
```

### Linting
```bash
pnpm lint
```
Runs ESLint with TypeScript support


## Dependencies

- `react@^19.2.0` — UI framework
- `react-dom@^19.2.0` — React DOM renderer
- `clsx@^2.1.1` — Utility for conditional classNames (optional)
- TypeScript `~5.9.3` with `strict: true`
- Vite 7.2.4 for fast dev server and builds
