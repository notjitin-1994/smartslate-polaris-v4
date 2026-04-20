'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

const FooterLink = ({ href, children, external = false }: FooterLinkProps) => {
  const linkClass = cn(
    'hover:text-primary text-white/60 transition-colors duration-200',
    'text-sm font-medium',
    'block'
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

export function Footer(): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-primary/20 relative mt-auto border-t bg-slate-900/95 backdrop-blur-sm">
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-8 text-left sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Company Info */}
          <div className="text-left lg:col-span-1">
            <div className="mb-6">
              <a
                href="https://www.smartslate.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-opacity hover:opacity-90"
              >
                <Image
                  src="/logo.png"
                  alt="Smartslate Logo"
                  width={378}
                  height={95}
                  loading="lazy"
                  className="h-auto w-[151px] sm:w-[378px]"
                />
              </a>
            </div>

            <p className="mb-6 text-left text-sm leading-relaxed text-white/60">
              Revolutionizing the way the world learns through innovative educational technology.
            </p>
          </div>

          {/* Products */}
          <div className="text-left">
            <h3 className="mb-4 text-left text-sm font-semibold tracking-wider text-white uppercase">
              Products
            </h3>
            <nav className="flex flex-col items-start gap-3">
              <FooterLink href="https://www.smartslate.io/features" external>
                Solara: Features
              </FooterLink>
              <FooterLink href="https://www.smartslate.io/pricing" external>
                Solara: Pricing
              </FooterLink>
            </nav>
          </div>

          {/* Services */}
          <div className="text-left">
            <h3 className="mb-4 text-left text-sm font-semibold tracking-wider text-white uppercase">
              Services
            </h3>
            <nav className="flex flex-col items-start gap-3">
              <FooterLink href="https://www.smartslate.io/ignite" external>
                Ignite
              </FooterLink>
              <FooterLink href="https://www.smartslate.io/products" external>
                Strategic Skills Architecture
              </FooterLink>
            </nav>
          </div>

          {/* Company */}
          <div className="text-left">
            <h3 className="mb-4 text-left text-sm font-semibold tracking-wider text-white uppercase">
              Company
            </h3>
            <nav className="flex flex-col items-start gap-3">
              <FooterLink href="https://www.smartslate.io/difference" external>
                About Us
              </FooterLink>
              <FooterLink href="https://www.smartslate.io/careers" external>
                Careers
              </FooterLink>
              <FooterLink href="https://www.smartslate.io/contact" external>
                Contact
              </FooterLink>
              <FooterLink href="https://www.smartslate.io/partner" external>
                Partners
              </FooterLink>
            </nav>
          </div>

          {/* Legal */}
          <div className="text-left">
            <h3 className="mb-4 text-left text-sm font-semibold tracking-wider text-white uppercase">
              Legal
            </h3>
            <nav className="flex flex-col items-start gap-3">
              <FooterLink href="https://www.smartslate.io/legal/privacy" external>
                Privacy Policy
              </FooterLink>
              <FooterLink href="https://www.smartslate.io/legal/terms" external>
                Terms of Service
              </FooterLink>
              <FooterLink href="https://www.smartslate.io/cookies" external>
                Cookie Policy
              </FooterLink>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-primary/20 mt-12 border-t pt-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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
