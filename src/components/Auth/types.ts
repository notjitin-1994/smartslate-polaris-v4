/**
 * Type definitions for LoginMarketingSection components
 * World-class login marketing for learning professionals
 */

import type React from 'react';

export type PersonaType =
  | 'instructional-designer'
  | 'lxd-specialist'
  | 'training-facilitator'
  | 'content-developer'
  | 'id-manager'
  | 'ld-leader';

export interface PersonaStat {
  value: number;
  suffix: string;
  label: string;
}

export interface PersonaData {
  id: PersonaType;
  icon: React.ReactElement;
  label: string; // Short name for tabs (e.g., "ID", "LXD")
  title: string; // Full role name
  subtitle: string; // Pain point → solution headline
  benefits: string[]; // 7+ feature bullets
  stats: PersonaStat[];
  color: string; // Persona-specific accent color
  gradient: string; // Tailwind gradient classes
}

export interface TestimonialData {
  quote: string;
  author: string;
  role: string;
  company: string;
}
