# Database Explorer - Admin Dashboard

## Overview

A beautiful, accessible database administration page built with Smartslate Polaris design system. This tool allows developers to explore database tables, view schemas, and export data in multiple formats.

## Features

### 1. Database Overview

- **Stats Cards**: Display total tables, total rows, and database health status
- **Real-time Data**: Auto-refreshing statistics with manual refresh button
- **Health Monitoring**: Visual indicators for database health

### 2. Table Explorer

- **Table Selection**: Dropdown with row counts for each table
- **Pagination**: Navigate through large datasets (50 rows per page)
- **Sorting**: Click column headers to sort ascending/descending
- **Search**: Filter data by search terms (when implemented)
- **Export**: Download data in JSON or CSV formats

### 3. Schema Viewer

- **Collapsible Panel**: Toggle schema information on/off
- **Column Details**: View column names, types, nullability, and defaults
- **Constraints**: Display primary keys, foreign keys, and indexes (when available)

### 4. Design System Compliance

#### Glassmorphism

- All cards use `bg-white/5 backdrop-blur-lg` for premium glass effect
- Borders use `border-white/10` for subtle separation
- Schema panel uses cyan accent: `border-cyan-500/30 bg-cyan-500/5`

#### Touch Targets

- All buttons meet 44x44px minimum touch target size
- Icon buttons: `min-h-[44px] min-w-[44px]`
- Regular buttons: `min-h-[44px]` with generous padding

#### Accessibility

- ARIA labels on all icon-only buttons
- Keyboard navigation support
- Focus states with visible rings
- Color contrast: WCAG AA compliant
- Screen reader friendly

#### Typography

- Headers: Bold, white text with proper hierarchy
- Body text: `text-white/60` for secondary content
- Monospace for code/data: `font-mono`

#### Animations

- Smooth fade-in-up for cards: `initial={{ opacity: 0, y: 20 }}`
- Staggered delays for visual hierarchy
- Collapsible panels with height animation
- Loading spinners with proper ARIA attributes

#### Colors

- Primary accent: Cyan (`text-cyan-400`, `bg-cyan-500`)
- Success: Green (`text-green-400`)
- Info: Blue (`text-blue-400`)
- Error: Red (for future error states)

## API Routes

### GET /api/admin/database

Returns list of all tables with metadata.

**Response:**

```json
{
  "tables": [
    {
      "tableName": "user_profiles",
      "schema": "public",
      "rowCount": 150,
      "estimatedSize": "1.2 MB"
    }
  ],
  "totalTables": 5,
  "totalRows": 1250,
  "databaseHealth": "healthy"
}
```

### GET /api/admin/database/[tableName]

Returns paginated table data.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Rows per page (default: 50, max: 100)
- `sortBy`: Column to sort by (default: 'id')
- `sortOrder`: 'asc' or 'desc' (default: 'asc')
- `search`: Search term (optional)

**Response:**

```json
{
  "data": [
    /* array of row objects */
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET /api/admin/database/[tableName]/schema

Returns table schema information.

**Response:**

```json
{
  "tableName": "user_profiles",
  "columns": [
    {
      "column_name": "id",
      "data_type": "uuid",
      "is_nullable": "NO",
      "column_default": "gen_random_uuid()"
    }
  ],
  "primaryKeys": ["id"],
  "foreignKeys": [],
  "indexes": []
}
```

## Security

### Role-Based Access Control

- **Required Role**: Developer or Admin
- **Authentication**: Supabase session-based
- **Authorization**: Server-side role checks in all API routes

### Protection Mechanisms

1. Table name validation (alphanumeric + underscore only)
2. User authentication check before data access
3. Role verification against user_profiles table
4. No direct database access from client

## Usage

### Accessing the Page

Navigate to: `/admin/database`

### Exporting Data

1. Select a table from the dropdown
2. Click "Export JSON" or "Export CSV"
3. File downloads automatically with table name

### Viewing Schema

1. Select a table
2. Click "Show Schema" button
3. Panel animates open with column details

## Performance Considerations

- **Pagination**: Max 100 rows per request
- **Debounced Search**: Prevents excessive API calls (when implemented)
- **Lazy Schema Loading**: Only fetches when panel is opened
- **Client-side Caching**: Stats cached until manual refresh
- **Optimistic UI**: Instant feedback for user actions

## Responsive Design

### Mobile (< 768px)

- Single column layout
- Stacked controls
- Full-width table selector
- Touch-optimized 48px+ buttons

### Tablet (768px - 1024px)

- Two-column stats grid
- Side-by-side controls
- Horizontal scrolling for wide tables

### Desktop (> 1024px)

- Three-column stats grid
- All controls visible
- Optimal table viewing

## Future Enhancements

1. **Search Functionality**: Full-text search across columns
2. **Advanced Filtering**: Column-specific filters
3. **Bulk Operations**: Multi-row selection and actions
4. **Data Editing**: Inline editing with validation
5. **Query Builder**: Visual SQL query construction
6. **Export Templates**: Custom column selection for exports
7. **Real-time Updates**: WebSocket-based live data
8. **Performance Metrics**: Query execution time tracking

## Files Structure

```
frontend/app/(auth)/admin/database/
├── page.tsx                          # Main UI component
├── README.md                         # This file
└── (api routes handled separately)

frontend/app/api/admin/database/
├── route.ts                          # GET tables list
├── [tableName]/
│   ├── route.ts                     # GET table data
│   └── schema/
│       └── route.ts                 # GET table schema
```

## Component Dependencies

- `@/components/ui/card` - Glassmorphic containers
- `@/components/ui/table` - Data grid display
- `@/components/ui/button` - Touch-optimized buttons
- `@/components/ui/select` - Accessible dropdown
- `@/components/ui/badge` - Status indicators
- `lucide-react` - Icon library
- `framer-motion` - Smooth animations

## Accessibility Checklist

- [x] Keyboard navigation (Tab, Enter, Arrow keys)
- [x] Screen reader support (ARIA labels)
- [x] Focus management (visible focus rings)
- [x] Color contrast (4.5:1+ for text)
- [x] Touch targets (44x44px minimum)
- [x] Loading states (with aria-busy)
- [x] Error handling (user-friendly messages)
- [x] Semantic HTML (proper headings, tables)

## Testing

### Manual Testing Steps

1. Navigate to `/admin/database`
2. Verify stats cards load correctly
3. Select different tables from dropdown
4. Test pagination controls
5. Click column headers to sort
6. Toggle schema panel open/close
7. Export data in both formats
8. Test on mobile/tablet/desktop
9. Verify touch targets on mobile
10. Test with screen reader

### Type Safety

Run: `npm run typecheck` from frontend directory

### Linting

Run: `npm run lint` from frontend directory

---

**Created with Smartslate Polaris Design System**
Following brand identity guidelines for premium, accessible UX/UI.
