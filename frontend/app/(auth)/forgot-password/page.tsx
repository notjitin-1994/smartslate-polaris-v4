import type { Metadata } from 'next';
import ForgotPasswordPageClient from './ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Reset Password | Smartslate Polaris',
  description: 'Reset your Smartslate Polaris account password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
