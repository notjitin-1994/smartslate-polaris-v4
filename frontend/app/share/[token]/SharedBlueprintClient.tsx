'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import SharedBlueprintView from './SharedBlueprintView';
import type { BlueprintJSON } from '@/components/blueprint/types';

interface BlueprintData {
  id: string;
  title: string;
  created_at: string;
  blueprint_json: BlueprintJSON;
  blueprint_markdown?: string;
}

interface SharedBlueprintClientProps {
  token: string;
  initialData?: BlueprintData; // Optional for backwards compatibility
}

export default function SharedBlueprintClient({
  token,
  initialData,
}: SharedBlueprintClientProps): React.JSX.Element {
  const [data, setData] = useState<BlueprintData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData); // Only load if no initial data
  const [error, setError] = useState<string | null>(null);

  // Fetch blueprint data if not provided as initialData
  useEffect(() => {
    // If we already have initial data, don't fetch
    if (initialData) {
      setData(initialData);
      return;
    }

    // Fetch blueprint using share token
    async function fetchBlueprint() {
      try {
        setLoading(true);
        console.log('[Share Client] Fetching blueprint for token:', token);

        const response = await fetch(`/api/starmaps/share/${token}`);

        if (!response.ok) {
          console.error('[Share Client] Failed to fetch:', response.status);
          if (response.status === 404) {
            setError('This blueprint is not available or sharing has been disabled.');
          } else {
            setError('Failed to load blueprint. Please try again later.');
          }
          setLoading(false);
          return;
        }

        const result = await response.json();

        if (!result.success || !result.blueprint) {
          console.error('[Share Client] Invalid response:', result);
          setError('Invalid blueprint data received.');
          setLoading(false);
          return;
        }

        console.log('[Share Client] Successfully loaded blueprint:', result.blueprint.title);
        setData(result.blueprint as BlueprintData);
      } catch (err) {
        console.error('[Share Client] Error loading shared blueprint:', err);
        setError('An unexpected error occurred while loading the blueprint.');
      } finally {
        setLoading(false);
      }
    }

    fetchBlueprint();
  }, [token, initialData]);

  // Loading state (shouldn't happen with server-side data)
  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="border-t-primary mx-auto mb-6 h-16 w-16 rounded-full border-4 border-r-transparent border-b-transparent border-l-transparent"
          />
          <h2 className="mb-2 text-2xl font-bold text-white">Loading Blueprint</h2>
          <p className="text-text-secondary">Preparing your learning experience...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">Blueprint Not Found</h2>
          <p className="text-text-secondary mb-8">
            {error || 'The blueprint you are looking for does not exist or is no longer shared.'}
          </p>
          <a
            href="https://polaris.smartslate.io"
            className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black transition-colors"
          >
            Create Your Own Blueprint
          </a>
        </motion.div>
      </div>
    );
  }

  return <SharedBlueprintView blueprint={data} />;
}
