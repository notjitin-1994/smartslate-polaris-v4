# Blueprint Page Analysis

## Overview
This document provides a comprehensive analysis of the blueprint page structure (`/blueprint/[id]`), including where data comes from, how it's stored, and how downloads are currently implemented.

---

## 1. Blueprint Page Location & Entry Point

### Page Path
- **Route**: `/blueprint/[id]` (authenticated)
- **File**: `/home/jitin-m-nair/Desktop/polaris-v3/frontend/app/(auth)/blueprint/[id]/page.tsx`
- **Type**: Client component (`'use client'`)
- **Framework**: React 19, Next.js 15 App Router

### Route Parameters
```typescript
interface PageProps {
  params: Promise<{ id: string }>;  // Blueprint ID (UUID)
}
```

---

## 2. Data Storage & Schema

### Database Table: `blueprint_generator`

**Location**: `supabase/migrations/0003_blueprint_generator.sql`

**Structure**:
```sql
CREATE TABLE public.blueprint_generator (
  id UUID PRIMARY KEY,                    -- Blueprint ID
  user_id UUID NOT NULL,                 -- Owner (FK to auth.users)
  version INTEGER DEFAULT 1,             -- Version tracking
  static_answers JSONB,                  -- Phase 1 questionnaire responses
  dynamic_questions JSONB,               -- AI-generated questions (Phase 2)
  dynamic_answers JSONB,                 -- Phase 2 questionnaire responses
  blueprint_json JSONB NOT NULL,         -- Structured blueprint data
  blueprint_markdown TEXT NULL,          -- **Markdown representation of blueprint**
  status TEXT,                           -- Workflow: draft|generating|completed|error
  created_at TIMESTAMPTZ,                -- Creation timestamp
  updated_at TIMESTAMPTZ                 -- Last update timestamp
);
```

**Row Level Security (RLS)**: Users can only access their own blueprints via auth policies.

---

## 3. Data Fetching in Blueprint Page

### Data Retrieval
```typescript
// Line 90-95 in page.tsx
const { data: blueprintData, error: fetchError } = await supabase
  .from('blueprint_generator')
  .select('id, user_id, blueprint_markdown, blueprint_json, title, created_at')
  .eq('id', id)
  .eq('user_id', currentUser.id)
  .single();
```

### Available Data
```typescript
type BlueprintData = {
  id: string;                      // UUID
  user_id: string;                 // Owner
  blueprint_markdown: string | null; // **Key: Raw markdown content**
  blueprint_json: unknown;         // **Key: Structured JSON data**
  title: string | null;            // Blueprint name
  created_at: string;              // ISO timestamp
};
```

**NOTE**: `title` field is NOT explicitly in the select query, but the `blueprint_markdown` and `blueprint_json` are the primary data sources.

---

## 4. Current Download/Export Implementation

### Download Button Location

**Position**: Hero section (top-right area)
- **File**: `/home/jitin-m-nair/Desktop/polaris-v3/frontend/app/(auth)/blueprint/[id]/page.tsx`
- **Lines**: 536-580
- **Handler**: `handleExportWord()` function

### Download Button UI
```jsx
<motion.button
  onClick={handleExportWord}
  onHoverStart={() => setIsDownloadButtonHovered(true)}
  onHoverEnd={() => setIsDownloadButtonHovered(false)}
  disabled={isExporting || !normalizedBlueprint}
  className="... rounded-full bg-primary ..."
>
  {/* Animated download icon */}
  <Download className="h-5 w-5" />
  {/* Expands to show "Download Blueprint" text on hover */}
</motion.button>
```

### Export Function
```typescript
// Line 231-270
const handleExportWord = async () => {
  if (!data || !blueprintData || !isFullBlueprint(blueprintData)) return;
  
  setIsExporting(true);
  showToast('Preparing Word document export...');
  
  try {
    const { exportService } = await import('@/lib/export/ExportService');
    
    const result = await exportService.exportBlueprint(blueprintData, {
      format: 'docx',
      includeMetadata: true,
      includeCharts: false,
      pageSize: 'A4',
      orientation: 'portrait',
      quality: 'high',
    });
    
    if (result.success && result.data) {
      // Create blob and download
      const url = URL.createObjectURL(result.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${blueprintTitle.replace(/[^a-zA-Z0-9\s-_]/g, '')}_${date}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Word document downloaded successfully');
    }
  } catch (error) {
    showToast('Word export failed. Please try again.');
  } finally {
    setIsExporting(false);
  }
};
```

---

## 5. Export Service Architecture

### File Structure
```
frontend/lib/export/
├── ExportService.ts              # Main service (lines 1-459)
├── markdownGenerator.ts          # Markdown export (lines 1-312)
├── wordGenerator.ts              # Word/DOCX export
├── blueprintPDFExport.ts         # PDF export (lines 1-278)
├── pdfGenerator.ts
├── jsonGenerator.ts
├── types.ts                       # TypeScript interfaces
└── ... other utilities
```

### Export Service Class
**Location**: `frontend/lib/export/ExportService.ts`

**Primary Method**:
```typescript
public async exportBlueprint(
  blueprint: AnyBlueprint,
  options: ExportOptions,
  dashboardData?: DashboardData,
  metadata?: Partial<ExportMetadata>
): Promise<ExportResult>
```

**Supported Formats**:
- `pdf` - PDF document
- `markdown` - Markdown file
- `json` - JSON data
- `docx` - Word document

---

## 6. Markdown Content Access

### Where Markdown is Used

#### 1. **Direct Storage**
```typescript
// In database
blueprint_markdown: string | null  // Full markdown content
```

#### 2. **Display Component** (Lines 687-695)
```jsx
{normalizedBlueprint ? (
  <InteractiveBlueprintDashboard 
    blueprint={normalizedBlueprint as any} 
    isPublicView={false} 
  />
) : (
  <div>Blueprint Data Not Available</div>
)}
```

#### 3. **PDF Export** (blueprintPDFExport.ts)
```typescript
const markdown = data.blueprint_markdown ?? '# Blueprint\n\nNo content available.';
htmlContent += generateMarkdownPage(markdown, createdDate);
```

The `generateMarkdownPage()` function converts markdown to HTML for PDF rendering.

#### 4. **Word Export** (via ExportService)
The `ExportService.exportBlueprint()` method with format `'docx'` uses the markdown content through the `WordGenerator` class.

### Markdown Converter
**File**: `frontend/lib/services/blueprintMarkdownConverter.ts`
- Converts blueprint JSON → markdown format
- Used during initial blueprint generation

---

## 7. Blueprint JSON Structure

### Structure Access
```typescript
// Line 274-303
let blueprintData: AnyBlueprint | null = null;
if (data?.blueprint_json) {
  try {
    blueprintData = typeof data.blueprint_json === 'string'
      ? JSON.parse(data.blueprint_json)
      : data.blueprint_json;
    
    // Remove internal metadata
    const { _generation_metadata, ...cleanBlueprint } = blueprintData;
    blueprintData = cleanBlueprint;
  } catch (e) {
    console.error('Failed to parse blueprint JSON:', e);
  }
}
```

### Expected Schema
```typescript
type BlueprintJSON = {
  metadata?: {
    title: string;
    organization: string;
    role: string;
    generated_at: string;
    version: string;
    model: string;
  };
  executive_summary?: string;
  content_outline?: {
    modules: Array<{
      title: string;
      duration: string;
      topics: string[];
      delivery_method: string;
      prerequisites: string[];
    }>;
  };
  learning_objectives?: {
    objectives: Array<{
      title: string;
    }>;
  };
  instructional_strategy?: {
    cohort_model?: string;
  };
  // ... additional sections
};
```

---

## 8. Download Features Summary

### Available Download Buttons

1. **Word Document (.docx)**
   - Handler: `handleExportWord()`
   - Uses: `ExportService` with format `'docx'`
   - Status: Currently implemented
   - Data source: `blueprint_json` + `blueprint_markdown`

2. **PDF Export** (via _handleExportPDF - unused)
   - Handler: `_handleExportPDF()` (line 207-229)
   - Uses: `blueprintPDFExport.ts`
   - Status: Code exists but prefixed with underscore (disabled)
   - Data source: `blueprint_markdown` + `blueprint_json`

### Export Options Available
```typescript
interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'docx';
  includeMetadata?: boolean;
  includeCharts?: boolean;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  quality?: 'low' | 'medium' | 'high';
}
```

---

## 9. Data Flow for Downloads

```
User clicks Download Button
          ↓
handleExportWord() executes
          ↓
Validates: data && blueprintData && isFullBlueprint(blueprintData)
          ↓
Imports ExportService dynamically
          ↓
Calls exportService.exportBlueprint(blueprintData, options)
          ↓
ExportService.exportToWord() → WordGenerator.generateWordDocument()
          ↓
Converts blueprint_json → structured DOCX format
Includes blueprint_markdown content
          ↓
Returns Blob of DOCX file
          ↓
Browser download triggered via:
  - Create object URL from Blob
  - Create hidden <a> element
  - Set href and download filename
  - Trigger click()
  - Clean up resources
```

---

## 10. Markdown Storage & Usage

### Where Markdown Comes From
1. **During blueprint generation**: AI creates both JSON and markdown representations
2. **Stored in database**: `blueprint_markdown` column (TEXT type)
3. **Retrieved on page load**: Part of the SELECT query

### How Markdown is Used
1. **Interactive Dashboard**: Displayed via `InteractiveBlueprintDashboard` component
2. **PDF Export**: Converted to HTML and rendered in PDF
3. **Word Export**: Integrated into DOCX structure
4. **Markdown Export**: Raw markdown download (via ExportService)

### Markdown Editing
```typescript
// Lines 138-165 handleSaveMarkdown()
const handleSaveMarkdown = async (newMarkdown: string): Promise<void> => {
  const { error: updateError } = await supabase
    .from('blueprint_generator')
    .update({ blueprint_markdown: newMarkdown })
    .eq('id', data.id)
    .eq('user_id', user.id);
};
```

Users can edit markdown content directly and it's saved back to the database.

---

## 11. Key Components & Dependencies

### Components Used
- `InteractiveBlueprintDashboard`: Main blueprint viewer
- `BlueprintRenderer`: Markdown rendering with pagination
- `RenameDialog`: Rename blueprint dialog

### External Libraries
- **Export**: 
  - `html2pdf.js` - PDF generation
  - `jszip` - ZIP file creation (for batch exports)
  - `docx` - Word document generation
- **Markdown**:
  - `react-markdown` - Markdown rendering
  - `remark-gfm` - GitHub-flavored markdown
  - `rehype-raw`, `rehype-sanitize`, `rehype-highlight` - HTML processing

### State Management
- React hooks for local state
- Supabase for persistent data
- Zustand (optional) for global state

---

## 12. Important Implementation Details

### Page Type
- **Server vs Client**: Marked with `'use client'` (client component)
- Fetches user data client-side after mounting
- Dynamic imports for lazy-loaded export services

### Error Handling
- Auth check: If no user, shows error screen
- Blueprint validation: Checks if `normalizedBlueprint` exists before rendering
- Export error handling: Try-catch blocks with user-friendly toasts

### Performance Considerations
- Lazy-loads ExportService (lines 214, 238, 269)
- Uses `React.useMemo` for normalization (line 310)
- Avoids unnecessary re-renders with AnimatePresence

### Security
- RLS policies enforce user isolation at database level
- Supabase auth session required
- User ID validated in both database query and update operations

---

## 13. Title Field Issue

### Potential Issue
The page retrieves `blueprint_markdown` and `blueprint_json` from the database, but there's a note about missing `title` field:

```typescript
// Line 306-307
const blueprintTitle = 
  data?.title ?? 'Starmap for Professional Development and Career Growth Path';
```

**Current behavior**: Falls back to default title if `data.title` is undefined.

**Note**: The `title` field might be stored in `blueprint_json.metadata.title` instead of a separate column. Need to verify schema to confirm if there's an actual `title` column in the table.

---

## Summary Table

| Aspect | Location | Details |
|--------|----------|---------|
| **Page File** | `frontend/app/(auth)/blueprint/[id]/page.tsx` | Main blueprint page |
| **Database Table** | `blueprint_generator` | Stores all blueprint data |
| **Markdown Storage** | `blueprint_markdown` (TEXT column) | Full markdown content |
| **JSON Storage** | `blueprint_json` (JSONB column) | Structured data |
| **Export Service** | `frontend/lib/export/ExportService.ts` | Handles all exports |
| **Markdown Generator** | `frontend/lib/export/markdownGenerator.ts` | Converts to markdown |
| **Word Export** | `frontend/lib/export/wordGenerator.ts` | Creates DOCX files |
| **PDF Export** | `frontend/lib/export/blueprintPDFExport.ts` | Creates PDF files |
| **Download Button** | Lines 536-580 in page.tsx | Word document download |
| **Hero Section** | Top-right area with animations | Contains all action buttons |

---

## Next Steps for Enhancement

If you're planning to add markdown download functionality:

1. **Create markdown download button** in hero section (similar to Word button)
2. **Call ExportService** with format `'markdown'`
3. **Handle the Blob response** and trigger browser download
4. **Add markdown option** to the export menu

The infrastructure is already in place; just needs UI integration!
