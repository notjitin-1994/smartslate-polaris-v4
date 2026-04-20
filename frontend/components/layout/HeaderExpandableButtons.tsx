'use client';

import React from 'react';
import { ExpandableNavButton } from './ExpandableNavButton';
import { Rocket, ExternalLink } from 'lucide-react';

/**
 * HeaderExpandableButtons - Pre-configured expandable buttons for header
 * Includes "Explore Solara Learning Engine" and "Learn More" buttons
 */
export function HeaderExpandableButtons() {
  return (
    <div className="flex items-center gap-2">
      <ExpandableNavButton
        title="Explore Solara Learning Engine"
        icon={Rocket}
        href="https://solara.smartslate.io"
        gradient="from-primary via-secondary to-primary"
        isExternal={true}
      />
      <ExpandableNavButton
        title="Learn More"
        icon={ExternalLink}
        href="https://www.smartslate.io"
        gradient="from-primary to-secondary"
        isExternal={true}
      />
    </div>
  );
}
