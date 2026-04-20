import { memo, type ReactNode } from 'react';

type Perk = {
  title: string;
  description: string;
  icon: ReactNode;
};

const IconSpark = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="text-primary"
  >
    <path d="M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
  </svg>
);

const IconChart = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="text-secondary"
  >
    <path d="M3 21h18" />
    <rect x="6" y="11" width="3" height="7" />
    <rect x="11" y="8" width="3" height="10" />
    <rect x="16" y="5" width="3" height="13" />
  </svg>
);

const IconShield = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="text-emerald-400"
  >
    <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const PERKS: Perk[] = [];

export const PolarisPerks = memo(function PolarisPerks() {
  return null;
});

PolarisPerks.displayName = 'PolarisPerks';
