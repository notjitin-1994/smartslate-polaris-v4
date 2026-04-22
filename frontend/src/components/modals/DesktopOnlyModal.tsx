'use client';

import React from 'react';
import { Monitor } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DesktopOnlyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

/**
 * Modal that informs users they need to use a desktop to create blueprints/starmaps
 * Displayed when users try to create on mobile/tablet devices
 */
export function DesktopOnlyModal({
  open,
  onOpenChange,
  featureName = 'Blueprint/Starmap Creation',
}: DesktopOnlyModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="bg-primary/10 rounded-full p-3">
              <Monitor className="text-primary h-8 w-8" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Desktop Experience Required</DialogTitle>
          <DialogDescription className="mt-4 text-center">
            <p className="mb-3">
              <span className="text-foreground font-semibold">{featureName}</span> is optimized for
              desktop devices.
            </p>
            <p>
              Please visit Polaris on your desktop or laptop to create and manage your starmaps.
              This ensures the best experience for complex questionnaires and learning design
              creation.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Got It
          </Button>
          <Button onClick={handleClose} className="flex-1">
            Dismiss
          </Button>
        </div>

        <p className="text-text-secondary mt-4 text-center text-xs">
          You can still view your existing starmaps on mobile
        </p>
      </DialogContent>
    </Dialog>
  );
}
