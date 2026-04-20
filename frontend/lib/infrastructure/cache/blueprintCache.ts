/**
 * Blueprint Generation Cache
 *
 * Intelligent caching system for blueprint generation that caches similar
 * questionnaires to reduce AI API calls and improve response times.
 */

import crypto from 'crypto';
import { blueprintCache as enhancedCache } from './enhancedCache';
import type { BlueprintGenerator } from '@/types/supabase';

interface CacheKeyComponents {
  staticHash: string;
  domainHash: string;
  complexityHash: string;
  version: string;
}

interface BlueprintCacheEntry {
  blueprint: Partial<BlueprintGenerator>;
  questionnaireHash: string;
  generatedAt: number;
  similarity: number;
  useCount: number;
}

interface CacheHitResult {
  cachedBlueprint: Partial<BlueprintGenerator>;
  similarity: number;
  cacheAge: number;
  useCount: number;
}

class BlueprintCache {
  private cache = enhancedCache;
  private similarityThreshold = 0.85; // 85% similarity threshold

  /**
   * Generate a comprehensive cache key for questionnaire data
   */
  private generateCacheKeyComponents(staticAnswers: Record<string, any>): CacheKeyComponents {
    // Extract key components for similarity matching
    const domain = staticAnswers.domain || staticAnswers.subject_area || '';
    const complexity = staticAnswers.complexity_level || staticAnswers.experience_level || '';
    const version = 'v1'; // Cache version for invalidation

    // Generate hashes for different components
    const staticHash = crypto.createHash('md5').update(JSON.stringify(staticAnswers)).digest('hex');

    const domainHash = crypto.createHash('md5').update(domain.toLowerCase().trim()).digest('hex');

    const complexityHash = crypto
      .createHash('md5')
      .update(complexity.toLowerCase().trim())
      .digest('hex');

    return {
      staticHash,
      domainHash,
      complexityHash,
      version,
    };
  }

  /**
   * Calculate similarity between two questionnaires
   */
  private calculateSimilarity(
    originalAnswers: Record<string, any>,
    newAnswers: Record<string, any>
  ): number {
    // Extract comparable fields
    const fields = [
      'domain',
      'subject_area',
      'complexity_level',
      'experience_level',
      'goal_type',
      'timeline',
      'audience_type',
      'skill_level',
    ];

    let matchingFields = 0;
    let totalFields = 0;

    for (const field of fields) {
      const originalValue = originalAnswers[field];
      const newValue = newAnswers[field];

      if (originalValue !== undefined || newValue !== undefined) {
        totalFields++;

        if (originalValue === newValue) {
          matchingFields++;
        } else if (typeof originalValue === 'string' && typeof newValue === 'string') {
          // Calculate string similarity for text fields
          const similarity = this.stringSimilarity(
            originalValue.toLowerCase(),
            newValue.toLowerCase()
          );
          if (similarity > 0.7) {
            matchingFields += similarity;
          }
        }
      }
    }

    return totalFields > 0 ? matchingFields / totalFields : 0;
  }

  /**
   * Calculate string similarity using Jaccard similarity
   */
  private stringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate cache keys for different similarity levels
   */
  private generateCacheKeys(components: CacheKeyComponents): string[] {
    const keys = [];

    // Exact match key
    keys.push(`blueprint:exact:${components.staticHash}`);

    // Domain similarity key
    keys.push(`blueprint:domain:${components.domainHash}`);

    // Complexity similarity key
    keys.push(`blueprint:complexity:${components.complexityHash}`);

    // Combined domain + complexity key
    keys.push(`blueprint:combined:${components.domainHash}:${components.complexityHash}`);

    return keys;
  }

  /**
   * Try to find cached blueprint for similar questionnaire
   */
  async findSimilarBlueprint(staticAnswers: Record<string, any>): Promise<CacheHitResult | null> {
    try {
      const components = this.generateCacheKeyComponents(staticAnswers);
      const cacheKeys = this.generateCacheKeys(components);

      // Try different cache keys in order of specificity
      for (const cacheKey of cacheKeys) {
        const cached = await this.cache.get<BlueprintCacheEntry>(cacheKey);

        if (cached) {
          const similarity = this.calculateSimilarity(cached.questionnaireHash, staticAnswers);

          if (similarity >= this.similarityThreshold) {
            // Update usage statistics
            cached.useCount++;
            await this.cache.set(cacheKey, cached);

            return {
              cachedBlueprint: cached.blueprint,
              similarity,
              cacheAge: Date.now() - cached.generatedAt,
              useCount: cached.useCount,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Blueprint cache: Failed to find similar blueprint', error);
      return null;
    }
  }

  /**
   * Store generated blueprint in cache
   */
  async storeBlueprint(
    staticAnswers: Record<string, any>,
    blueprint: Partial<BlueprintGenerator>,
    similarityScore = 1.0
  ): Promise<void> {
    try {
      const components = this.generateCacheKeyComponents(staticAnswers);
      const cacheKeys = this.generateCacheKeys(components);

      const cacheEntry: BlueprintCacheEntry = {
        blueprint,
        questionnaireHash: staticAnswers,
        generatedAt: Date.now(),
        similarity: similarityScore,
        useCount: 1,
      };

      // Store with different TTLs based on specificity
      const ttlMap = {
        exact: 7 * 24 * 60 * 60 * 1000, // 7 days for exact matches
        domain: 24 * 60 * 60 * 1000, // 1 day for domain matches
        complexity: 24 * 60 * 60 * 1000, // 1 day for complexity matches
        combined: 3 * 24 * 60 * 60 * 1000, // 3 days for combined matches
      };

      // Store all cache keys with appropriate TTLs
      for (let i = 0; i < cacheKeys.length; i++) {
        const cacheKey = cacheKeys[i];
        const keyType = cacheKey.split(':')[1];
        const ttl = ttlMap[keyType as keyof typeof ttlMap] || ttlMap.exact;

        await this.cache.set(cacheKey, cacheEntry, ttl);
      }

      console.log(`Blueprint cache: Stored blueprint with ${similarityScore * 100}% similarity`);
    } catch (error) {
      console.error('Blueprint cache: Failed to store blueprint', error);
    }
  }

  /**
   * Get cached blueprint by exact match
   */
  async getExactBlueprint(
    staticAnswers: Record<string, any>
  ): Promise<Partial<BlueprintGenerator> | null> {
    try {
      const components = this.generateCacheKeyComponents(staticAnswers);
      const exactKey = `blueprint:exact:${components.staticHash}`;

      const cached = await this.cache.get<BlueprintCacheEntry>(exactKey);

      if (cached) {
        // Update usage count
        cached.useCount++;
        await this.cache.set(exactKey, cached);

        return cached.blueprint;
      }

      return null;
    } catch (error) {
      console.error('Blueprint cache: Failed to get exact blueprint', error);
      return null;
    }
  }

  /**
   * Invalidate cache entries
   */
  async invalidate(staticAnswers?: Record<string, any>): Promise<void> {
    try {
      if (staticAnswers) {
        // Invalidate specific questionnaire
        const components = this.generateCacheKeyComponents(staticAnswers);
        const cacheKeys = this.generateCacheKeys(components);

        for (const cacheKey of cacheKeys) {
          await this.cache.delete(cacheKey);
        }
      } else {
        // Invalidate all blueprint cache entries
        await this.cache.clear('blueprint:*');
      }
    } catch (error) {
      console.error('Blueprint cache: Failed to invalidate cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    exactMatches: number;
    similarMatches: number;
    averageUseCount: number;
    hitRate: number;
    cacheAge: {
      newest: number;
      oldest: number;
      average: number;
    };
  }> {
    try {
      // This would require additional tracking in a real implementation
      // For now, return basic stats from the underlying cache
      const stats = await this.cache.getStats();

      return {
        totalEntries: stats.memory.memorySize,
        exactMatches: 0, // Would need custom tracking
        similarMatches: 0, // Would need custom tracking
        averageUseCount: 0, // Would need custom tracking
        hitRate: stats.totalHitRate,
        cacheAge: {
          newest: 0, // Would need custom tracking
          oldest: 0, // Would need custom tracking
          average: 0, // Would need custom tracking
        },
      };
    } catch (error) {
      console.error('Blueprint cache: Failed to get stats', error);
      return {
        totalEntries: 0,
        exactMatches: 0,
        similarMatches: 0,
        averageUseCount: 0,
        hitRate: 0,
        cacheAge: { newest: 0, oldest: 0, average: 0 },
      };
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    try {
      await this.cache.cleanup();
    } catch (error) {
      console.error('Blueprint cache: Failed to cleanup', error);
    }
  }

  /**
   * Close cache connection
   */
  async disconnect(): Promise<void> {
    await this.cache.disconnect();
  }
}

// Export singleton instance
export const blueprintCache = new BlueprintCache();

// Export utility functions for use in blueprint generation service
export async function getCachedBlueprint(
  staticAnswers: Record<string, any>
): Promise<Partial<BlueprintGenerator> | null> {
  return blueprintCache.getExactBlueprint(staticAnswers);
}

export async function getSimilarBlueprint(
  staticAnswers: Record<string, any>
): Promise<Partial<BlueprintGenerator> | null> {
  const result = await blueprintCache.findSimilarBlueprint(staticAnswers);
  return result?.cachedBlueprint || null;
}

export async function cacheBlueprint(
  staticAnswers: Record<string, any>,
  blueprint: Partial<BlueprintGenerator>
): Promise<void> {
  await blueprintCache.storeBlueprint(staticAnswers, blueprint);
}

export async function invalidateBlueprintCache(staticAnswers?: Record<string, any>): Promise<void> {
  await blueprintCache.invalidate(staticAnswers);
}

export default blueprintCache;
