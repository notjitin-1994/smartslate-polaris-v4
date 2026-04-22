'use client';

export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  ArrowLeft,
  Edit3,
  ExternalLink,
  CheckCircle,
  Loader2,
  Plus,
  Rocket,
  Presentation as PresentationIcon,
  Wand2,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { RenameDialog } from '@/components/ui/RenameDialog';
import { VisualJSONEditor } from '@/components/modals/VisualJSONEditor';
import { InteractiveBlueprintDashboard } from '@/components/blueprint/InteractiveBlueprintDashboard';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { createBrowserBlueprintService } from '@/lib/db/blueprints.client';
import { useRouter } from 'next/navigation';
import { useMobileDetect } from '@/lib/hooks/useMobileDetect';
import { PresentationMode } from '@/components/presentation/PresentationMode';
import blueprintToSlides from '@/lib/presentation/blueprintToSlides';
import type { Presentation } from '@/types/presentation';
import { ShareDialog } from '@/components/share/ShareDialog';
import { ShareLinkManager } from '@/components/share/ShareLinkManager';
import { ShareAnalyticsDashboard } from '@/components/share/ShareAnalyticsDashboard';
import type { ShareLink } from '@/types/share';
// Removed Ollama imports - using Gemini-based validation
// import { parseAndValidateBlueprintJSON } from '@/lib/ollama/blueprintValidation';
// import { AnyBlueprint, isFullBlueprint } from '@/lib/ollama/schema';

// Simple replacements for removed Ollama functions
type AnyBlueprint = any;
const isFullBlueprint = (data: any): boolean => {
  return data && typeof data === 'object' && Object.keys(data).length > 0;
};
const parseAndValidateBlueprintJSON = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};

interface PageProps {
  params: Promise<{ id: string }>;
}

type BlueprintData = {
  id: string;
  user_id: string;
  blueprint_markdown: string | null;
  blueprint_json: unknown;
  title: string | null;
  created_at: string;
};

export default function BlueprintPage({ params }: PageProps): React.JSX.Element {
  const router = useRouter();
  const { shouldReduceAnimations, isMobile } = useMobileDetect();
  const [blueprintId, setBlueprintId] = useState<string>('');
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [data, setData] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [renamingBlueprint, setRenamingBlueprint] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showShareAnalytics, setShowShareAnalytics] = useState(false);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [activeShares, setActiveShares] = useState<ShareLink[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isSolaraButtonHovered, setIsSolaraButtonHovered] = useState(false);
  const [isShareButtonHovered, setIsShareButtonHovered] = useState(false);
  const [isDownloadButtonHovered, setIsDownloadButtonHovered] = useState(false);
  const [isPresentButtonHovered, setIsPresentButtonHovered] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // JSON Editor Modal State for Executive Summary
  const [isExecutiveSummaryEditorOpen, setIsExecutiveSummaryEditorOpen] = useState(false);

  // Unwrap params and fetch data
  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;
        setBlueprintId(id);

        const supabase = getSupabaseBrowserClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          setError(true);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        const { data: blueprintData, error: fetchError } = await supabase
          .from('blueprint_generator')
          .select('id, user_id, blueprint_markdown, blueprint_json, title, created_at')
          .eq('id', id)
          .eq('user_id', currentUser.id)
          .single();

        if (fetchError || !blueprintData) {
          setError(true);
        } else {
          setData(blueprintData as BlueprintData);
        }
      } catch (err) {
        console.error('Error loading blueprint:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

  const handleRenameBlueprint = async (newTitle: string): Promise<void> => {
    if (!user?.id || !data) {
      throw new Error('User not authenticated or no blueprint data');
    }

    try {
      const updatedBlueprint = await createBrowserBlueprintService().updateBlueprintTitle(
        data.id,
        newTitle,
        user.id
      );

      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, title: updatedBlueprint.title || newTitle.trim() };
      });

      showToast('Blueprint renamed successfully');
    } catch (err) {
      console.error('Error renaming blueprint:', err);
      throw err;
    }
  };

  const handleSaveMarkdown = async (newMarkdown: string): Promise<void> => {
    if (!user?.id || !data) {
      throw new Error('User not authenticated or no blueprint data');
    }

    try {
      const supabase = getSupabaseBrowserClient();

      const { error: updateError } = await supabase
        .from('blueprint_generator')
        .update({ blueprint_markdown: newMarkdown })
        .eq('id', data.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, blueprint_markdown: newMarkdown };
      });

      showToast('Blueprint updated successfully');
    } catch (err) {
      console.error('Error saving markdown:', err);
      throw err;
    }
  };

  // Handle share creation callback
  const handleShareCreated = (shareLink: ShareLink) => {
    setActiveShares([shareLink, ...activeShares]);
    // Automatically copy the first share link to clipboard
    if (shareLink.shareUrl) {
      navigator.clipboard
        .writeText(shareLink.shareUrl)
        .then(() => {
          showToast('Share link created and copied to clipboard!');
        })
        .catch(() => {
          showToast('Share link created successfully!');
        });
    } else {
      showToast('Share link created successfully!');
    }
  };

  // Handle share update callback
  const handleShareUpdated = (shareLink: ShareLink) => {
    setActiveShares(activeShares.map((s) => (s.id === shareLink.id ? shareLink : s)));
    showToast('Share link updated successfully!');
  };

  // Handle share revoke callback
  const handleShareRevoked = (shareId: string) => {
    setActiveShares(activeShares.filter((s) => s.id !== shareId));
    showToast('Share link revoked successfully.');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Executive Summary JSON Editor Handlers
  const handleOpenExecutiveSummaryEditor = () => {
    setIsExecutiveSummaryEditorOpen(true);
  };

  const handleCloseExecutiveSummaryEditor = () => {
    setIsExecutiveSummaryEditorOpen(false);
  };

  const handleSaveExecutiveSummary = async (editedJSON: unknown) => {
    try {
      console.log('Saving Executive Summary changes:', editedJSON);

      const response = await fetch('/api/blueprints/update-section', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blueprintId: data?.id,
          sectionId: 'executive_summary',
          data: editedJSON,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      const result = await response.json();
      console.log('Save successful:', result);

      // Refresh the page data to show updated content
      window.location.reload();

      showToast('Executive Summary updated successfully!');
    } catch (error) {
      console.error('Error saving executive summary:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to save changes. Please try again.'
      );
    }
  };

  const _handleExportPDF = async () => {
    if (!data) return;

    setIsExporting(true);
    showToast('Preparing PDF export...');

    try {
      const { exportBlueprintToPDF } = await import('@/lib/export/blueprintPDFExport');
      await exportBlueprintToPDF({
        id: data.id,
        title: data.title,
        created_at: data.created_at,
        blueprint_markdown: data.blueprint_markdown,
        blueprint_json: data.blueprint_json,
      });
      showToast('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (!data) return;

    setIsExporting(true);
    showToast('Preparing plain markdown Word document export...');

    try {
      const { generatePlainMarkdownWordDocument } = await import('@/lib/export/wordGenerator');

      // Use the blueprint_markdown field directly for a plain export
      const markdownContent = data.blueprint_markdown || 'No content available';

      const result = await generatePlainMarkdownWordDocument(markdownContent, blueprintTitle);

      if (result.success && result.data) {
        // Create download link
        const url = URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${blueprintTitle.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Plain markdown Word document downloaded successfully');
      } else {
        throw new Error(result.error || 'Word export failed');
      }
    } catch (error) {
      console.error('Word export error:', error);
      showToast('Word export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Parse and normalize blueprint JSON for dashboard (BEFORE conditional returns)
  let blueprintData: AnyBlueprint | null = null;
  if (data?.blueprint_json) {
    try {
      // Parse the blueprint JSON (already validated during generation)
      blueprintData =
        typeof data.blueprint_json === 'string'
          ? JSON.parse(data.blueprint_json)
          : data.blueprint_json;

      // Remove internal generation metadata if present
      if (blueprintData && typeof blueprintData === 'object') {
        const { _generation_metadata, ...cleanBlueprint } = blueprintData as Record<
          string,
          unknown
        >;
        blueprintData = cleanBlueprint as AnyBlueprint;
      }
    } catch (e) {
      console.error('Failed to parse blueprint JSON:', e);
      // Attempt Ollama normalization as fallback for legacy blueprints
      try {
        const rawBlueprint =
          typeof data.blueprint_json === 'string'
            ? data.blueprint_json
            : JSON.stringify(data.blueprint_json);
        blueprintData = parseAndValidateBlueprintJSON(rawBlueprint);
      } catch (fallbackError) {
        console.error('Failed to parse blueprint JSON (fallback):', fallbackError);
      }
    }
  }

  const markdown = data?.blueprint_markdown ?? '# Blueprint\n\nNo markdown available.';
  const blueprintTitle =
    data?.title ?? 'Starmap for Professional Development and Career Growth Path';

  // Helper function to normalize blueprint for InteractiveBlueprintDashboard
  const normalizedBlueprint = React.useMemo(() => {
    if (!blueprintData || !isFullBlueprint(blueprintData)) {
      console.log('Blueprint validation failed:', {
        blueprintData,
        isValid: isFullBlueprint(blueprintData),
      });
      return null;
    }

    // Ensure the blueprint has all required sections with proper structure
    const normalized = {
      ...blueprintData,
      metadata: blueprintData.metadata || {
        title: blueprintTitle,
        organization: 'Organization',
        role: 'Professional',
        generated_at: data?.created_at || new Date().toISOString(),
        version: '1.0',
        model: 'claude',
      },
    };

    console.log('Normalized blueprint:', normalized);
    return normalized;
  }, [blueprintData, blueprintTitle, data?.created_at]);

  // Generate presentation data from blueprint
  const presentationData = React.useMemo((): Presentation | null => {
    if (!normalizedBlueprint) return null;

    // Debug: Log the blueprint structure
    console.log('Attempting to generate presentation from blueprint:', {
      hasMetadata: !!normalizedBlueprint.metadata,
      metadata: normalizedBlueprint.metadata,
      keys: Object.keys(normalizedBlueprint),
      hasContentOutline: !!normalizedBlueprint.content_outline,
      hasInstructionalStrategy: !!normalizedBlueprint.instructional_strategy,
      hasSustainability:
        !!normalizedBlueprint.sustainability_plan || !!normalizedBlueprint.sustainability,
      contentOutlineType: typeof normalizedBlueprint.content_outline,
      instructionalStrategyType: typeof normalizedBlueprint.instructional_strategy,
      sustainabilityType: typeof (
        normalizedBlueprint.sustainability_plan || normalizedBlueprint.sustainability
      ),
    });

    // Helper to normalize modules/content_outline
    const normalizeModules = (data: any) => {
      if (!data) return undefined;

      console.log('normalizeModules input:', {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: typeof data === 'object' ? Object.keys(data) : null,
        sample: Array.isArray(data) ? data[0] : data,
      });

      if (Array.isArray(data)) {
        return data.map((module: any, index: number) => ({
          title: module.title || module.name || module.topic || `Module ${index + 1}`,
          duration: module.duration || module.timeframe || '1 week',
          topics: Array.isArray(module.topics)
            ? module.topics
            : Array.isArray(module.learning_objectives)
              ? module.learning_objectives
              : module.description
                ? [module.description]
                : [],
          activities: Array.isArray(module.activities) ? module.activities : [],
          assessments: Array.isArray(module.assessments) ? module.assessments : [],
          objectives: Array.isArray(module.objectives) ? module.objectives : undefined,
          description: module.description || module.overview || undefined,
          order: module.order ?? index,
        }));
      }

      // Handle object with nested array (e.g., { modules: [...] })
      if (typeof data === 'object' && data.modules && Array.isArray(data.modules)) {
        return normalizeModules(data.modules);
      }

      // Handle object with nested content
      if (typeof data === 'object' && !Array.isArray(data)) {
        // Convert object to single module
        return [
          {
            title: data.title || data.name || 'Module',
            duration: data.duration || data.timeframe || '1 week',
            topics: Array.isArray(data.topics) ? data.topics : [],
            activities: Array.isArray(data.activities) ? data.activities : [],
            assessments: Array.isArray(data.assessments) ? data.assessments : [],
            description: data.description || data.overview || undefined,
            order: 0,
          },
        ];
      }

      return undefined;
    };

    // Helper to normalize resources
    const normalizeResources = (data: any) => {
      if (!data) return undefined;

      console.log('normalizeResources input:', {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: typeof data === 'object' ? Object.keys(data) : null,
      });

      if (Array.isArray(data)) {
        return data.map((resource: any) => ({
          name: resource.name || resource.title || 'Resource',
          title: resource.title || resource.name || 'Resource',
          type: resource.type || resource.category || 'reference',
          url: resource.url || resource.link || undefined,
          description: resource.description || undefined,
          category: resource.category || resource.type || undefined,
        }));
      }

      // Handle object with nested resources array
      if (typeof data === 'object' && data.resources && Array.isArray(data.resources)) {
        return normalizeResources(data.resources);
      }

      return undefined;
    };

    // Helper to normalize learning objectives (flatten nested structures)
    const normalizeObjectives = (data: any) => {
      if (!data) return undefined;
      // Handle { objectives: [...] } structure
      if (data.objectives && Array.isArray(data.objectives)) {
        return {
          objectives: data.objectives.map((obj: any) =>
            typeof obj === 'string'
              ? obj
              : obj.objective || obj.description || obj.title || JSON.stringify(obj)
          ),
        };
      }
      return data;
    };

    // Helper to normalize metrics (ensure name field exists)
    const normalizeMetrics = (data: any) => {
      if (!data) return undefined;
      // Handle { metrics: [...] } structure
      if (data.metrics && Array.isArray(data.metrics)) {
        return {
          metrics: data.metrics.map((metric: any) => ({
            name: metric.name || metric.title || metric.metric || 'Metric',
            description: metric.description || undefined,
            target: metric.target || metric.goal || undefined,
            current: metric.current || metric.baseline || undefined,
          })),
        };
      }
      return data;
    };

    // Helper to normalize timeline (ensure phases array exists)
    const normalizeTimeline = (data: any) => {
      if (!data) return undefined;

      // If already has phases or timeline array, return as-is
      if (data.phases || data.timeline) {
        return data;
      }

      // If it's an array, wrap in phases
      if (Array.isArray(data)) {
        return { phases: data };
      }

      return data;
    };

    // Helper to normalize assessments (ensure assessments array exists)
    const normalizeAssessments = (data: any) => {
      if (!data) return undefined;

      // If already has assessments array, return as-is
      if (data.assessments && Array.isArray(data.assessments)) {
        return data;
      }

      // If it's an array, wrap in assessments
      if (Array.isArray(data)) {
        return { assessments: data };
      }

      return data;
    };

    // Transform blueprint to match presentation schema
    // All slide transformers expect nested structures: { modules: { modules: [...] } }
    const normalizedModules = normalizeModules(
      normalizedBlueprint.modules ||
        normalizedBlueprint.learning_modules ||
        normalizedBlueprint.curriculum
    );
    const normalizedResources = normalizeResources(normalizedBlueprint.resources);
    const normalizedObjectives = normalizeObjectives(
      normalizedBlueprint.learning_objectives || normalizedBlueprint.objectives
    );
    const normalizedMetrics = normalizeMetrics(
      normalizedBlueprint.metrics || normalizedBlueprint.success_metrics
    );
    const normalizedTimeline = normalizeTimeline(
      normalizedBlueprint.timeline ||
        normalizedBlueprint.implementation_plan ||
        normalizedBlueprint.schedule
    );
    const normalizedAssessments = normalizeAssessments(
      normalizedBlueprint.assessments || normalizedBlueprint.evaluation
    );

    const transformedBlueprint = {
      ...normalizedBlueprint,

      // Use ONLY ONE key per section to prevent duplicates
      // Remove all aliases to avoid processing same content multiple times

      // Modules - use primary key only
      modules: normalizedModules ? { modules: normalizedModules } : undefined,
      learning_modules: undefined, // Remove alias
      curriculum: undefined, // Remove alias

      // Resources - use primary key only
      resources: normalizedResources ? { resources: normalizedResources } : undefined,
      learning_resources: undefined, // Remove alias

      // Objectives - use primary key only
      objectives: normalizedObjectives,
      learning_objectives: undefined, // Remove alias

      // Metrics - use primary key only
      metrics: normalizedMetrics,
      kpis: undefined, // Remove alias
      success_metrics: undefined, // Remove alias

      // Timeline - use primary key only
      timeline: normalizedTimeline,
      implementation_plan: undefined, // Remove alias
      schedule: undefined, // Remove alias

      // Assessments - use primary key only
      assessments: normalizedAssessments,
      evaluation: undefined, // Remove alias

      // Risks - use primary key only
      risks: normalizedBlueprint.risks || normalizedBlueprint.risk_mitigation,
      risk_management: undefined, // Remove alias

      // Ensure executive_summary is a string
      executive_summary:
        typeof normalizedBlueprint.executive_summary === 'object'
          ? normalizedBlueprint.executive_summary?.content ||
            JSON.stringify(normalizedBlueprint.executive_summary)
          : normalizedBlueprint.executive_summary,
    };

    console.log('Transformed blueprint for presentation:', {
      keys: Object.keys(transformedBlueprint),
      hasModules: !!transformedBlueprint.modules,
      modulesCount: transformedBlueprint.modules?.length,
      sampleModule: transformedBlueprint.modules?.[0],
      hasObjectives: !!transformedBlueprint.learning_objectives,
      objectivesCount: transformedBlueprint.learning_objectives?.objectives?.length,
      hasMetrics: !!transformedBlueprint.metrics,
      metricsCount: transformedBlueprint.metrics?.metrics?.length,
      hasExecutiveSummary: !!transformedBlueprint.executive_summary,
      executiveSummaryLength: transformedBlueprint.executive_summary?.length,
      allSections: Object.keys(transformedBlueprint).filter(
        (k) => !['metadata'].includes(k) && transformedBlueprint[k] != null
      ),
    });

    try {
      const result = blueprintToSlides(transformedBlueprint, {
        sanitizeContent: true,
        includeSpeakerNotes: true,
      });

      console.log('Presentation generation successful!', {
        slideCount: result.slides.length,
        slides: result.slides.map((s) => ({
          type: s.type,
          title: s.title,
          hasContent: 'content' in s && !!s.content,
          hasBullets: 'bullets' in s && !!s.bullets,
          hasMetrics: 'metrics' in s && !!s.metrics,
          bulletCount: 'bullets' in s ? s.bullets?.length : 0,
        })),
      });

      return {
        id: data?.id || 'blueprint-presentation',
        blueprintId: data?.id || '',
        title: blueprintTitle,
        slides: result.slides,
        settings: {
          theme: 'dark',
          fontSize: 'medium',
          animations: true,
          transitions: true,
          laserPointerColor: '#14b8a6',
          laserPointerSize: 16,
          showProgressBar: true,
          showSlideNumbers: true,
          showTimer: false,
          autoHideControls: true,
          autoHideDelay: 3000,
          navigation: {
            enableKeyboard: true,
            enableSwipe: true,
            enableWheel: true,
            loop: false,
            autoAdvance: false,
          },
          shortcuts: {
            nextSlide: ['ArrowRight', 'Space', 'PageDown'],
            previousSlide: ['ArrowLeft', 'PageUp'],
            firstSlide: ['Home'],
            lastSlide: ['End'],
            toggleFullscreen: ['f', 'F11'],
            toggleSpeakerNotes: ['s', 'n'],
            toggleLaserPointer: ['l'],
            togglePlay: ['p'],
            exitPresentation: ['Escape'],
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      // Blueprint doesn't match presentation schema - Present button will be disabled
      console.error('Presentation mode unavailable: blueprint validation failed', {
        error: error instanceof Error ? error.message : error,
        errorDetails: error,
        blueprintStructure: {
          originalKeys: Object.keys(normalizedBlueprint),
          transformedKeys: Object.keys(transformedBlueprint),
          metadata: transformedBlueprint.metadata,
          modules: transformedBlueprint.modules,
          resources: transformedBlueprint.resources,
          objectives: transformedBlueprint.learning_objectives,
          metrics: transformedBlueprint.metrics,
          originalObjectives: normalizedBlueprint.learning_objectives,
          originalMetrics: normalizedBlueprint.metrics || normalizedBlueprint.success_metrics,
        },
      });
      return null;
    }
  }, [normalizedBlueprint, blueprintTitle, data?.id]);

  // Callbacks for presentation mode (memoized to prevent re-creation)
  const handlePresentationExit = React.useCallback(() => {
    setIsPresentationMode(false);
  }, []);

  const handlePresentationComplete = React.useCallback(() => {
    setIsPresentationMode(false);
    showToast('Presentation completed!');
  }, [showToast]);

  if (loading) {
    return (
      <main className="bg-background flex min-h-screen w-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md p-8 text-center"
        >
          <div className="border-primary/30 border-t-primary mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4" />
          <div className="skeleton-brand mx-auto mb-4 h-8 w-48 rounded-xl" />
          <div className="skeleton-brand mx-auto h-4 w-32 rounded-lg" />
        </motion.div>
      </main>
    );
  }

  if (error || !user || !data) {
    return (
      <main className="bg-background flex min-h-screen w-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md p-8 text-center"
        >
          <div className="bg-error/10 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
            <ExternalLink className="text-error h-8 w-8" />
          </div>
          <h2 className="text-foreground mb-2 text-xl font-bold">
            {!user ? 'Authentication Required' : 'Blueprint Not Found'}
          </h2>
          <p className="text-text-secondary mb-6">
            {!user
              ? 'Please sign in to view this blueprint.'
              : 'The blueprint you are looking for does not exist or you do not have access to it.'}
          </p>
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all hover:shadow-lg"
            href="/"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{!user ? 'Go to Dashboard' : 'Back to Dashboard'}</span>
          </Link>
        </motion.div>
      </main>
    );
  }

  const _createdDate = new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Extract executive summary for hero section
  const executiveSummary =
    normalizedBlueprint?.executive_summary?.content ||
    normalizedBlueprint?.executive_summary ||
    'No executive summary available.';

  // Conditionally render presentation mode or blueprint view
  return (
    <>
      {isPresentationMode && presentationData ? (
        <PresentationMode
          presentation={presentationData}
          onExit={handlePresentationExit}
          onComplete={handlePresentationComplete}
        />
      ) : (
        <>
          {/* Main Content */}
          <div className="bg-background relative w-full overflow-x-hidden">
            {/* Animated Background Pattern - Static on mobile for performance */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="bg-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl md:animate-pulse" />
              <div className="bg-secondary/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl md:animate-pulse md:delay-1000" />
              <div className="bg-primary/5 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl md:animate-pulse md:delay-500" />
            </div>

            {/* Hero Section - Minimalistic Design */}
            <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="space-y-8"
              >
                {/* Title Section - Clean Typography */}
                <div className="space-y-6">
                  {/* Platform Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    {/* Mobile-optimized Platform Banner */}
                    <div className="border-primary/40 inline-flex w-full items-center gap-2.5 rounded-full border bg-white/5 py-2 pr-4 pl-2 shadow-[0_0_20px_rgba(167,218,219,0.3)] sm:w-auto sm:text-sm">
                      <motion.div
                        className="relative h-6 w-6 flex-shrink-0 sm:h-7 sm:w-7"
                        animate={shouldReduceAnimations ? {} : { rotate: 360 }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <Image
                          src="/logo-swirl.png"
                          alt="Smartslate Polaris Logo"
                          fill
                          sizes="(max-width: 768px) 24px, 28px"
                          className="relative object-contain p-0.5"
                        />
                      </motion.div>
                      <span className="text-text-secondary text-[10px] leading-tight font-medium sm:text-sm">
                        Built by{' '}
                        <span className="text-primary font-semibold">Smartslate Polaris</span> |
                        Powered by{' '}
                        <span className="font-semibold text-yellow-400">
                          Solara Learning Engine
                        </span>
                      </span>
                    </div>

                    {/* Action Buttons Grid - Mobile Responsive */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:flex md:flex-wrap lg:flex-nowrap">
                      {/* Animated Create New Blueprint Button */}
                      <motion.button
                        onClick={() => window.open('https://polaris.smartslate.io', '_blank')}
                        onHoverStart={() => !isMobile && setIsButtonHovered(true)}
                        onHoverEnd={() => !isMobile && setIsButtonHovered(false)}
                        className="relative flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full bg-indigo-600 shadow-lg transition-colors hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 md:w-auto"
                        style={{ minWidth: '48px' }}
                        initial={false}
                        animate={{
                          width:
                            !isMobile && isButtonHovered ? '210px' : !isMobile ? '48px' : 'auto',
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <motion.div
                          className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                          animate={{
                            rotate: isButtonHovered ? 90 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
                          <span className="text-sm font-semibold text-white md:hidden">
                            Create New Blueprint
                          </span>
                        </motion.div>

                        <AnimatePresence>
                          {isButtonHovered && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2, delay: 0.05 }}
                              className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-white md:inline"
                            >
                              Create New Blueprint
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      {/* Animated Present Button */}
                      <motion.button
                        onClick={() => setIsPresentationMode(true)}
                        onHoverStart={() => !isMobile && setIsPresentButtonHovered(true)}
                        onHoverEnd={() => !isMobile && setIsPresentButtonHovered(false)}
                        disabled={!normalizedBlueprint || !presentationData}
                        className="relative flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full bg-indigo-600 shadow-lg transition-colors hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                        style={{ minWidth: '48px' }}
                        initial={false}
                        animate={{
                          width:
                            !isMobile && isPresentButtonHovered
                              ? '140px'
                              : !isMobile
                                ? '48px'
                                : 'auto',
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <motion.div
                          className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                          animate={{
                            scale: isPresentButtonHovered ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <PresentationIcon className="h-5 w-5 text-white" strokeWidth={2.5} />
                          <span className="text-sm font-semibold text-white md:hidden">
                            Present
                          </span>
                        </motion.div>

                        <AnimatePresence>
                          {isPresentButtonHovered && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2, delay: 0.05 }}
                              className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-white md:inline"
                            >
                              Present
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      {/* Advanced Share Dialog with Animated Trigger */}
                      {data && (
                        <ShareDialog
                          blueprintId={data.id}
                          blueprintTitle={data.title || 'Untitled Blueprint'}
                          existingShares={activeShares}
                          onShareCreated={handleShareCreated}
                          onShareUpdated={handleShareUpdated}
                          onShareRevoked={handleShareRevoked}
                          trigger={
                            <motion.button
                              onHoverStart={() => !isMobile && setIsShareButtonHovered(true)}
                              onHoverEnd={() => !isMobile && setIsShareButtonHovered(false)}
                              disabled={!data}
                              className="relative flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full bg-indigo-600 shadow-lg transition-colors hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                              style={{ minWidth: '48px' }}
                              initial={false}
                              animate={{
                                width:
                                  !isMobile && isShareButtonHovered
                                    ? '160px'
                                    : !isMobile
                                      ? '48px'
                                      : 'auto',
                              }}
                              transition={{
                                duration: 0.3,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                            >
                              {/* Mobile: Full width with text visible */}
                              <motion.div
                                className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                                animate={{
                                  scale: isShareButtonHovered ? 1.1 : 1,
                                  rotate: isShareButtonHovered ? 12 : 0,
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <Share2 className="h-5 w-5 text-white" strokeWidth={2.5} />
                                <span className="text-sm font-semibold text-white md:hidden">
                                  Share
                                </span>
                              </motion.div>

                              {/* Desktop: Animated Text */}
                              <AnimatePresence>
                                {isShareButtonHovered && (
                                  <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2, delay: 0.05 }}
                                    className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-white md:inline"
                                  >
                                    Share Blueprint
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          }
                        />
                      )}

                      {/* Animated Download Button */}
                      <motion.button
                        onClick={handleExportWord}
                        onHoverStart={() => !isMobile && setIsDownloadButtonHovered(true)}
                        onHoverEnd={() => !isMobile && setIsDownloadButtonHovered(false)}
                        disabled={isExporting || !normalizedBlueprint}
                        className="relative flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full bg-indigo-600 shadow-lg transition-colors hover:bg-indigo-700 active:scale-95 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                        style={{ minWidth: '48px' }}
                        initial={false}
                        animate={{
                          width:
                            !isMobile && isDownloadButtonHovered
                              ? '190px'
                              : !isMobile
                                ? '48px'
                                : 'auto',
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <motion.div
                          className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                          animate={{
                            y: isDownloadButtonHovered ? 2 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {isExporting ? (
                            <Loader2
                              className="h-5 w-5 animate-spin text-white"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Download className="h-5 w-5 text-white" strokeWidth={2.5} />
                          )}
                          {!isExporting && (
                            <span className="text-sm font-semibold text-white md:hidden">
                              Download
                            </span>
                          )}
                        </motion.div>

                        <AnimatePresence>
                          {isDownloadButtonHovered && !isExporting && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2, delay: 0.05 }}
                              className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-white md:inline"
                            >
                              Download Blueprint
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      {/* Animated Explore Solara Button */}
                      <motion.button
                        onClick={() => window.open('https://solara.smartslate.io', '_blank')}
                        onHoverStart={() => !isMobile && setIsSolaraButtonHovered(true)}
                        onHoverEnd={() => !isMobile && setIsSolaraButtonHovered(false)}
                        className="bg-primary hover:bg-primary/90 active:bg-primary/80 relative col-span-2 flex min-h-[48px] w-full touch-manipulation items-center justify-center overflow-hidden rounded-full shadow-lg transition-colors active:scale-95 md:col-span-1 md:w-auto"
                        style={{ minWidth: '48px' }}
                        initial={false}
                        animate={{
                          width:
                            !isMobile && isSolaraButtonHovered
                              ? '250px'
                              : !isMobile
                                ? '48px'
                                : 'auto',
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        {/* Icon Container */}
                        <motion.div
                          className="flex items-center gap-2 md:absolute md:top-0 md:left-0 md:h-12 md:w-12 md:justify-center"
                          animate={{
                            rotate: isSolaraButtonHovered ? -15 : 0,
                            y: isSolaraButtonHovered ? -2 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <Rocket className="h-5 w-5 text-black" strokeWidth={2.5} />
                          <span className="text-sm font-semibold text-black md:hidden">
                            Explore Solara Learning Engine
                          </span>
                        </motion.div>

                        {/* Desktop: Animated Text */}
                        <AnimatePresence>
                          {isSolaraButtonHovered && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2, delay: 0.05 }}
                              className="hidden pr-4 pl-12 text-sm font-semibold whitespace-nowrap text-black md:inline"
                            >
                              Explore Solara Learning Engine
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Main Title - Responsive Typography with Fluid Sizing */}
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="font-heading text-foreground text-2xl leading-tight font-semibold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                    style={{
                      fontSize: 'clamp(1.5rem, 4vw + 1rem, 4rem)',
                    }}
                  >
                    {blueprintTitle}
                  </motion.h1>

                  {/* Executive Summary - Mobile Responsive */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="relative"
                  >
                    {/* Header with Edit Buttons - Responsive Layout */}
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-text-primary text-lg font-semibold sm:text-xl">
                        Executive Summary
                      </h2>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Edit Section Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleOpenExecutiveSummaryEditor}
                          style={{ touchAction: 'manipulation' }}
                          className="pressable border-primary bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 hover:border-primary inline-flex h-11 min-h-[48px] w-11 min-w-[48px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-2 transition-all hover:shadow-[0_0_15px_rgba(167,218,219,0.6)] active:scale-95 sm:h-11 sm:min-h-[44px] sm:w-11 sm:min-w-[44px]"
                          title="Edit Section"
                          aria-label="Edit executive summary section"
                        >
                          <Edit className="h-5 w-5" />
                        </motion.button>

                        {/* Modify with AI Button */}
                        <motion.button
                          animate={
                            shouldReduceAnimations
                              ? {}
                              : {
                                  boxShadow: [
                                    '0 0 15px rgba(167,218,219,0.5)',
                                    '0 0 20px rgba(167,218,219,0.7)',
                                    '0 0 15px rgba(167,218,219,0.5)',
                                  ],
                                }
                          }
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => console.log('Modify Executive Summary')}
                          style={{ touchAction: 'manipulation' }}
                          className="pressable border-primary bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 hover:border-primary inline-flex h-11 min-h-[48px] w-11 min-w-[48px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-2 transition-all hover:shadow-[0_0_25px_rgba(167,218,219,0.8)] active:scale-95 sm:h-11 sm:min-h-[44px] sm:w-11 sm:min-w-[44px]"
                          title="Modify with AI"
                          aria-label="Modify executive summary with AI"
                        >
                          <Wand2 className="h-5 w-5 drop-shadow-[0_0_8px_rgba(167,218,219,0.9)]" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Executive Summary Paragraphs - Responsive Typography */}
                    <div className="space-y-3 sm:space-y-4">
                      {executiveSummary
                        .split(/\.\s+/)
                        .filter(Boolean)
                        .map((sentence: string, index: number) => (
                          <p
                            key={index}
                            className="text-text-secondary text-base leading-relaxed sm:text-lg md:text-xl"
                          >
                            {sentence.trim()}
                            {sentence.trim().endsWith('.') ? '' : '.'}
                          </p>
                        ))}
                    </div>
                  </motion.div>
                </div>

                {/* Metadata - Responsive Banner Format */}
                {normalizedBlueprint?.metadata && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="flex flex-wrap items-center gap-2 sm:gap-3"
                  >
                    {normalizedBlueprint.metadata.organization && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                        <span className="text-text-disabled">Organization:</span>
                        <span className="text-primary font-medium">
                          {normalizedBlueprint.metadata.organization}
                        </span>
                      </div>
                    )}

                    {normalizedBlueprint.metadata.role && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                        <span className="text-text-disabled">Role:</span>
                        <span className="text-primary font-medium">
                          {normalizedBlueprint.metadata.role}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </section>

            {/* Content with View Mode Support */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"
            >
              {/* Interactive Blueprint Dashboard */}
              {normalizedBlueprint ? (
                <InteractiveBlueprintDashboard
                  blueprint={normalizedBlueprint as any}
                  blueprintId={data.id}
                  isPublicView={false}
                />
              ) : (
                <div className="glass-card p-8 text-center">
                  <ExternalLink className="text-text-disabled mx-auto mb-4 h-12 w-12" />
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    Blueprint Data Not Available
                  </h3>
                  <p className="text-text-secondary text-sm">
                    The blueprint content could not be loaded. Please try refreshing the page.
                  </p>
                </div>
              )}

              {/* Share Management Section */}
              {data && activeShares.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="glass-card mt-8 p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-foreground text-lg font-semibold">Share Analytics</h3>
                    <button
                      onClick={() => setShowShareAnalytics(!showShareAnalytics)}
                      className="text-primary text-sm hover:underline"
                    >
                      {showShareAnalytics ? 'Hide' : 'Show'} Analytics
                    </button>
                  </div>

                  {showShareAnalytics && (
                    <div className="space-y-6">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="glass-card p-4">
                          <div className="text-text-secondary text-sm">Total Share Links</div>
                          <div className="text-primary mt-1 text-2xl font-bold">
                            {activeShares.length}
                          </div>
                        </div>
                        <div className="glass-card p-4">
                          <div className="text-text-secondary text-sm">Total Views</div>
                          <div className="text-primary mt-1 text-2xl font-bold">
                            {activeShares.reduce((sum, s) => sum + (s.viewCount || 0), 0)}
                          </div>
                        </div>
                        <div className="glass-card p-4">
                          <div className="text-text-secondary text-sm">Unique Viewers</div>
                          <div className="text-primary mt-1 text-2xl font-bold">
                            {activeShares.reduce((sum, s) => sum + (s.uniqueViewers || 0), 0)}
                          </div>
                        </div>
                      </div>

                      {/* Share Link Manager */}
                      <ShareLinkManager
                        blueprintId={data.id}
                        blueprintTitle={data.title || 'Untitled Blueprint'}
                        className="mt-4"
                      />

                      {/* Analytics Dashboard (if a specific share is selected) */}
                      {selectedShareId && (
                        <ShareAnalyticsDashboard shareId={selectedShareId} className="mt-4" />
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Success Toast */}
            <AnimatePresence>
              {showSuccessToast && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed right-6 bottom-6 z-50"
                >
                  <div className="bg-success/20 border-success/30 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl">
                    <CheckCircle className="text-success h-5 w-5" />
                    <span className="text-sm font-medium text-white">{toastMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rename Dialog */}
            <RenameDialog
              isOpen={renamingBlueprint}
              onClose={() => setRenamingBlueprint(false)}
              onConfirm={handleRenameBlueprint}
              currentName={blueprintTitle}
              title="Rename Blueprint"
              description="Give your blueprint a meaningful name"
              placeholder="Enter blueprint name..."
              maxLength={100}
            />

            {/* Visual JSON Editor Modal for Executive Summary */}
            <VisualJSONEditor
              isOpen={isExecutiveSummaryEditorOpen}
              onClose={handleCloseExecutiveSummaryEditor}
              onSave={handleSaveExecutiveSummary}
              sectionTitle="Executive Summary"
              sectionData={blueprintData?.executive_summary}
            />
          </div>
        </>
      )}
    </>
  );
}
