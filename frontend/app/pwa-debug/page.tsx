'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export default function PWADebugPage() {
  const [checks, setChecks] = useState({
    https: false,
    serviceWorker: false,
    manifest: false,
    standalone: false,
    installPromptAvailable: false,
  });

  const [details, setDetails] = useState({
    protocol: '',
    swStatus: '',
    swScope: '',
    manifestUrl: '',
    displayMode: '',
  });

  useEffect(() => {
    const runChecks = async () => {
      // Check HTTPS
      const isHttps =
        window.location.protocol === 'https:' || window.location.hostname === 'localhost';

      // Check Service Worker
      let swRegistered = false;
      let swDetails = { status: 'Not supported', scope: '' };

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            swRegistered = true;
            swDetails = {
              status: registration.active ? 'Active' : 'Installing',
              scope: registration.scope,
            };
          } else {
            swDetails.status = 'Not registered';
          }
        } catch (e) {
          swDetails.status = 'Error: ' + (e as Error).message;
        }
      }

      // Check Manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      const hasManifest = !!manifestLink;
      const manifestUrl = manifestLink?.getAttribute('href') || '';

      // Check Standalone mode
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      // Check if install prompt is available
      let installPromptAvailable = false;
      const checkInstallPrompt = (e: Event) => {
        e.preventDefault();
        installPromptAvailable = true;
        window.removeEventListener('beforeinstallprompt', checkInstallPrompt);
      };
      window.addEventListener('beforeinstallprompt', checkInstallPrompt);

      // Get display mode
      let displayMode = 'browser';
      if (window.matchMedia('(display-mode: standalone)').matches) {
        displayMode = 'standalone';
      } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        displayMode = 'minimal-ui';
      } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
        displayMode = 'fullscreen';
      }

      setChecks({
        https: isHttps,
        serviceWorker: swRegistered,
        manifest: hasManifest,
        standalone: isStandalone,
        installPromptAvailable,
      });

      setDetails({
        protocol: window.location.protocol,
        swStatus: swDetails.status,
        swScope: swDetails.scope,
        manifestUrl,
        displayMode,
      });

      // Check install prompt after a delay
      setTimeout(() => {
        window.removeEventListener('beforeinstallprompt', checkInstallPrompt);
      }, 3000);
    };

    runChecks();

    // Re-run checks when service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', runChecks);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', runChecks);
      }
    };
  }, []);

  const CheckItem = ({
    label,
    checked,
    detail,
  }: {
    label: string;
    checked: boolean;
    detail?: string;
  }) => (
    <div className="flex items-start space-x-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="mt-0.5">
        {checked ? (
          <Check className="h-5 w-5 text-green-400" />
        ) : (
          <X className="h-5 w-5 text-red-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-200">{label}</p>
        {detail && <p className="mt-1 text-sm text-gray-400">{detail}</p>}
      </div>
    </div>
  );

  const allChecksPassed = Object.values(checks).filter(Boolean).length >= 4; // At least 4 checks should pass

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-white">PWA Debug Information</h1>

        <div className="mb-8 rounded-lg border border-blue-700 bg-blue-900/30 p-6">
          <h2 className="mb-4 flex items-center text-xl font-semibold text-blue-300">
            <AlertCircle className="mr-2 h-5 w-5" />
            PWA Status
          </h2>
          {allChecksPassed ? (
            <p className="text-green-400">
              ✓ Your PWA is properly configured and ready to install!
            </p>
          ) : (
            <p className="text-yellow-400">
              ⚠ Some PWA requirements are not met. Check the items below.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-200">PWA Requirements</h2>

          <CheckItem
            label="HTTPS or Localhost"
            checked={checks.https}
            detail={`Protocol: ${details.protocol}`}
          />

          <CheckItem
            label="Service Worker"
            checked={checks.serviceWorker}
            detail={`Status: ${details.swStatus}${details.swScope ? ` | Scope: ${details.swScope}` : ''}`}
          />

          <CheckItem
            label="Web App Manifest"
            checked={checks.manifest}
            detail={details.manifestUrl ? `Manifest: ${details.manifestUrl}` : 'No manifest found'}
          />

          <CheckItem
            label="Install Prompt Available"
            checked={checks.installPromptAvailable}
            detail={
              checks.installPromptAvailable
                ? 'Browser install prompt is ready'
                : 'Waiting for browser to trigger install prompt...'
            }
          />

          <CheckItem
            label="Standalone Mode"
            checked={checks.standalone}
            detail={`Display mode: ${details.displayMode}`}
          />
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-200">Installation Instructions</h2>

          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h3 className="mb-3 font-semibold text-gray-200">To trigger the install prompt:</h3>
            <ol className="list-decimal space-y-2 pl-5 text-gray-300">
              <li>Ensure you're in production mode (npm run build && npm start)</li>
              <li>Visit the site over HTTPS or localhost</li>
              <li>Interact with the page (click somewhere)</li>
              <li>Look for the install icon in the address bar or use the custom install button</li>
            </ol>

            <h3 className="mt-6 mb-3 font-semibold text-gray-200">Manual installation:</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <strong>Chrome/Edge:</strong> Menu (3 dots) → "Install Smartslate Polaris"
              </li>
              <li>
                <strong>Safari iOS:</strong> Share button → "Add to Home Screen"
              </li>
              <li>
                <strong>Firefox:</strong> Currently limited PWA support on desktop
              </li>
            </ul>

            <h3 className="mt-6 mb-3 font-semibold text-gray-200">Testing in DevTools:</h3>
            <ol className="list-decimal space-y-2 pl-5 text-gray-300">
              <li>Open Chrome DevTools (F12)</li>
              <li>Go to Application tab</li>
              <li>Click on "Manifest" in the sidebar</li>
              <li>Click "Add to home screen" or "Install" button</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
