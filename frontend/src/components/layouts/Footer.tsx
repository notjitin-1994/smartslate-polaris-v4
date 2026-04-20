'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Twitter, Linkedin, Github, Youtube, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

const FooterLink = ({ href, children, external = false }: FooterLinkProps) => {
  const linkClass = cn(
    'text-white/60 transition-colors duration-200 hover:text-white',
    'text-sm font-medium',
    'block py-1'
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
};

interface SocialIconProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SocialIcon = ({ href, icon, label }: SocialIconProps) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      'flex h-10 w-10 items-center justify-center',
      'rounded-lg border border-white/10',
      'text-white/60 hover:border-white/20 hover:text-white',
      'bg-white/5 hover:bg-white/10',
      'transition-all duration-200',
      'touch-target-sm'
    )}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    aria-label={label}
  >
    {icon}
  </motion.a>
);

export function Footer(): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-slate-900/95 backdrop-blur-sm">
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Link href="/" className="inline-block transition-opacity hover:opacity-90">
                <Image
                  src="/logo.png"
                  alt="Smartslate Logo"
                  width={378}
                  height={95}
                  loading="lazy"
                  style={{ height: 'auto' }}
                />
              </Link>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-white/60">
              Revolutionizing the way the world learns through innovative educational technology and
              AI-powered personalized learning experiences.
            </p>

            {/* Social Media */}
            <div className="flex items-center gap-3">
              <SocialIcon
                href="https://twitter.com/smartslate"
                icon={<Twitter className="h-4 w-4" />}
                label="Follow us on Twitter"
              />
              <SocialIcon
                href="https://linkedin.com/company/smartslate"
                icon={<Linkedin className="h-4 w-4" />}
                label="Connect with us on LinkedIn"
              />
              <SocialIcon
                href="https://github.com/smartslate"
                icon={<Github className="h-4 w-4" />}
                label="View our GitHub repository"
              />
              <SocialIcon
                href="https://youtube.com/@smartslate"
                icon={<Youtube className="h-4 w-4" />}
                label="Watch our videos on YouTube"
              />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
              Product
            </h3>
            <nav className="space-y-1">
              <FooterLink href="/features">Features</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/templates">Templates</FooterLink>
              <FooterLink href="/updates">What's New</FooterLink>
              <FooterLink href="/demo">Request Demo</FooterLink>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
              Resources
            </h3>
            <nav className="space-y-1">
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/tutorials">Tutorials</FooterLink>
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/support">Help Center</FooterLink>
              <FooterLink href="/community">Community</FooterLink>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
              Company
            </h3>
            <nav className="space-y-1">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/careers">Careers</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="/partners">Partners</FooterLink>
              <FooterLink href="/press">Press Kit</FooterLink>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
              Legal
            </h3>
            <nav className="space-y-1">
              <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/legal/terms">Terms of Service</FooterLink>
              <FooterLink href="/legal/cookies">Cookie Policy</FooterLink>
              <FooterLink href="/legal/gdpr">GDPR Compliance</FooterLink>
              <FooterLink href="/security">Security</FooterLink>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>© {currentYear} Smartslate. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-1 text-sm text-white/60">
              <span>Made with</span>
              <Heart className="h-4 w-4 fill-current text-red-400" />
              <span>for better education</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
