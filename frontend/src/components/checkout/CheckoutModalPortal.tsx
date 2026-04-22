/**
 * Portal wrapper for CustomCheckoutModal
 * Ensures the modal renders at the document body level
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CheckoutModalPortalProps {
  children: React.ReactNode;
}

export function CheckoutModalPortal({ children }: CheckoutModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  // Create or get the portal container
  let portalRoot = document.getElementById('checkout-modal-root');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'checkout-modal-root';
    document.body.appendChild(portalRoot);
  }

  return createPortal(children, portalRoot);
}
