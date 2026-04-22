// Base components (leaf nodes)
export { Brand } from './Brand';
export { UserAvatar } from './UserAvatar';
export { NavSection } from './NavSection';
export { Footer } from './Footer';
export { SubscriptionCTA } from './SubscriptionCTA';
export * from './icons';

// Intermediate components
export { Header } from './Header';
export { GlobalHeader } from './GlobalHeader';
export { StandardHeader } from './StandardHeader';

// Layout components (composite nodes - NOT exported here to prevent circularity in composite apps)
// Import these directly from ./GlobalLayout or ./AppLayout

export type { NavItem, NavSectionProps } from './NavSection';
export type { StandardHeaderProps } from './StandardHeader';
