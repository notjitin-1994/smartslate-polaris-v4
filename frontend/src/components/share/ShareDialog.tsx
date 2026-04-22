/**
 * Advanced Share Dialog Component - Smartslate Polaris
 * Viewport-friendly design with nested modals for settings
 * Supports creating multiple share links with different permissions
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Share2,
  Copy,
  Link,
  Lock,
  Users,
  Eye,
  Clock,
  Mail,
  Shield,
  Download,
  Printer,
  BarChart3,
  Settings,
  Trash2,
  Check,
  AlertCircle,
  QrCode,
  Twitter,
  Linkedin,
  Facebook,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Sliders,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShareLink, SharePermissionLevel } from '@/types/share';
import { format, addDays, addHours } from 'date-fns';
import QRCode from 'qrcode';

// Form schema
const shareSchema = z.object({
  permissionLevel: z.enum(['view']).default('view'),
  password: z.string().min(6).optional().or(z.literal('')),
  maxViews: z.number().int().positive().optional().or(z.literal(0)),
  expiresIn: z.string().optional(),
  customSlug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .or(z.literal('')),
  allowDownload: z.boolean().default(true),
  allowPrint: z.boolean().default(true),
  allowCopy: z.boolean().default(false),
  showAnalytics: z.boolean().default(false),
  requireEmail: z.boolean().default(false),
  allowedEmails: z.string().optional(),
  customTitle: z.string().max(200).optional(),
  customDescription: z.string().max(500).optional(),
});

type ShareFormData = z.infer<typeof shareSchema>;

interface ShareDialogProps {
  blueprintId: string;
  blueprintTitle: string;
  trigger?: React.ReactNode;
  existingShares?: ShareLink[];
  onShareCreated?: (shareLink: ShareLink) => void;
  onShareUpdated?: (shareLink: ShareLink) => void;
  onShareRevoked?: (shareId: string) => void;
}

export function ShareDialog({
  blueprintId,
  blueprintTitle,
  trigger,
  existingShares = [],
  onShareCreated,
  onShareUpdated,
  onShareRevoked,
}: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [shares, setShares] = useState<ShareLink[]>(existingShares);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedShare, setSelectedShare] = useState<ShareLink | null>(null);

  // Nested modal states
  const [securityOpen, setSecurityOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShareFormData>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      permissionLevel: 'view',
      allowDownload: true,
      allowPrint: true,
      allowCopy: false,
      showAnalytics: false,
      requireEmail: false,
    },
  });

  const permissionLevel = watch('permissionLevel');
  const password = watch('password');
  const maxViews = watch('maxViews');
  const expiresIn = watch('expiresIn');
  const customSlug = watch('customSlug');
  const allowDownload = watch('allowDownload');
  const allowPrint = watch('allowPrint');
  const allowCopy = watch('allowCopy');
  const requireEmail = watch('requireEmail');
  const customTitle = watch('customTitle');
  const customDescription = watch('customDescription');

  // Load existing shares
  useEffect(() => {
    if (open) {
      loadExistingShares();
    }
  }, [open, blueprintId]);

  const loadExistingShares = async () => {
    try {
      const response = await fetch(`/api/share/list?blueprintId=${blueprintId}`);
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const onSubmit = async (data: ShareFormData) => {
    setLoading(true);
    try {
      let expiresAt: string | undefined;
      if (data.expiresIn) {
        const [value, unit] = data.expiresIn.split('-');
        const numValue = parseInt(value);
        if (unit === 'hours') {
          expiresAt = addHours(new Date(), numValue).toISOString();
        } else if (unit === 'days') {
          expiresAt = addDays(new Date(), numValue).toISOString();
        }
      }

      const allowedEmails = data.allowedEmails
        ?.split(',')
        .map((e) => e.trim())
        .filter((e) => e.includes('@'));

      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          permissionLevel: data.permissionLevel,
          password: data.password || undefined,
          maxViews: data.maxViews || undefined,
          expiresAt,
          customSlug: data.customSlug || undefined,
          allowDownload: data.allowDownload,
          allowPrint: data.allowPrint,
          allowCopy: data.allowCopy,
          showAnalytics: data.showAnalytics,
          requireEmail: data.requireEmail,
          allowedEmails,
          customTitle: data.customTitle || blueprintTitle,
          customDescription: data.customDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create share link');
      }

      const result = await response.json();
      const newShare = result.shareLink;

      setShares([newShare, ...shares]);
      setSelectedShare(newShare);
      setActiveTab('manage');
      reset();

      toast({
        title: 'Share link created',
        description: 'Your share link has been created successfully.',
      });

      onShareCreated?.(newShare);

      if (newShare.shareUrl) {
        const qr = await QRCode.toDataURL(newShare.shareUrl);
        setQrCode(qr);
      }
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create share link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async (share: ShareLink) => {
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: 'Copied',
        description: 'Share link copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const revokeShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this share link?')) return;

    try {
      const response = await fetch(`/api/share/${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke share link');
      }

      setShares(shares.filter((s) => s.id !== shareId));
      if (selectedShare?.id === shareId) {
        setSelectedShare(null);
      }

      toast({
        title: 'Share link revoked',
        description: 'The share link has been revoked successfully.',
      });

      onShareRevoked?.(shareId);
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke share link',
        variant: 'destructive',
      });
    }
  };

  const getPermissionIcon = (level: SharePermissionLevel) => {
    return <Eye className="h-5 w-5" />;
  };

  const getPermissionColor = (level: SharePermissionLevel) => {
    return 'bg-primary/10 text-primary border-primary/30';
  };

  const getPermissionDescription = (level: SharePermissionLevel) => {
    return 'Can view and read the blueprint';
  };

  const shareOnSocial = (platform: 'twitter' | 'linkedin' | 'facebook', url: string) => {
    const text = `Check out this learning blueprint: ${blueprintTitle}`;
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  // Summary functions for button badges
  const getSecuritySummary = () => {
    const items = [];
    if (password) items.push('Password');
    if (expiresIn) {
      const [value, unit] = expiresIn.split('-');
      items.push(`${value} ${unit === 'hours' ? 'hr' : 'd'}`);
    }
    if (maxViews) items.push(`${maxViews} views`);
    if (customSlug) items.push('Custom URL');
    return items.length > 0 ? items.join(' • ') : 'No security settings';
  };

  const getPermissionsSummary = () => {
    const enabled = [allowDownload, allowPrint, allowCopy, requireEmail].filter(Boolean).length;
    return enabled > 0 ? `${enabled} enabled` : 'Default permissions';
  };

  const getCustomizationSummary = () => {
    const items = [];
    if (customTitle) items.push('Custom title');
    if (customDescription) items.push('Description');
    return items.length > 0 ? items.join(' • ') : 'No customization';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="medium" className="min-h-[44px]">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-semibold">
              <div className="bg-primary/15 rounded-xl p-2.5">
                <Share2 className="text-primary h-6 w-6" />
              </div>
              Share Blueprint
            </DialogTitle>
            <DialogDescription>
              Create and manage share links for &quot;{blueprintTitle}&quot;
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">
                <Sparkles className="mr-2 h-4 w-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="manage">
                <Link className="mr-2 h-4 w-4" />
                Manage{' '}
                {shares.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {shares.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* CREATE TAB - Viewport Friendly */}
            <TabsContent value="create" className="flex-1 overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto px-1">
                  {/* Settings Buttons */}
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Advanced Settings</Label>

                    {/* Security Button */}
                    <button
                      type="button"
                      onClick={() => setSecurityOpen(true)}
                      className="border-border hover:border-primary/30 hover:bg-secondary/30 flex min-h-[72px] w-full items-center justify-between rounded-xl border-2 p-4 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 rounded-lg p-3">
                          <Shield className="text-primary h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2 font-semibold">
                            Security
                            {(password || maxViews || expiresIn || customSlug) && (
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {getSecuritySummary()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground h-5 w-5" />
                    </button>

                    {/* Permissions Button */}
                    <button
                      type="button"
                      onClick={() => setPermissionsOpen(true)}
                      className="border-border flex min-h-[72px] w-full items-center justify-between rounded-xl border-2 p-4 transition-all hover:border-blue-500/30 hover:bg-blue-50/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-blue-500/10 p-3">
                          <Sliders className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2 font-semibold">
                            Permissions
                            {(allowDownload || allowPrint || allowCopy || requireEmail) && (
                              <Badge variant="secondary" className="text-xs">
                                Customized
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {getPermissionsSummary()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground h-5 w-5" />
                    </button>

                    {/* Customization Button */}
                    <button
                      type="button"
                      onClick={() => setCustomizationOpen(true)}
                      className="border-border flex min-h-[72px] w-full items-center justify-between rounded-xl border-2 p-4 transition-all hover:border-amber-500/30 hover:bg-amber-50/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-amber-500/10 p-3">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2 font-semibold">
                            Customization
                            {(customTitle || customDescription) && (
                              <Badge variant="secondary" className="text-xs">
                                Custom
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {getCustomizationSummary()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 border-t pt-4">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 min-h-[56px] w-full text-lg font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      'Creating...'
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Create Share Link
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* MANAGE TAB */}
            <TabsContent value="manage" className="flex-1 overflow-hidden">
              {shares.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12">
                  <div className="bg-primary/10 mb-4 rounded-full p-6">
                    <Share2 className="text-primary h-12 w-12" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">No share links yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first share link to get started
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create First Link
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {shares.map((share) => (
                      <div key={share.id} className="space-y-3 rounded-xl border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn('gap-1', getPermissionColor(share.permissionLevel))}
                              >
                                {getPermissionIcon(share.permissionLevel)}
                                {share.permissionLevel}
                              </Badge>
                              {share.hasPassword && (
                                <Badge variant="secondary">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Password
                                </Badge>
                              )}
                              {share.expiresAt && (
                                <Badge variant="secondary">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Expires {format(new Date(share.expiresAt), 'MMM d')}
                                </Badge>
                              )}
                            </div>
                            <code className="bg-secondary rounded px-2 py-1 text-xs">
                              {share.shareUrl.replace(/^https?:\/\/[^\/]+/, '')}
                            </code>
                            <div className="text-muted-foreground text-xs">
                              {share.viewCount} views • {share.uniqueViewers} unique
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyShareLink(share)}
                            >
                              {copiedId === share.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => revokeShare(share.id)}
                            >
                              <Trash2 className="text-destructive h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="flex-1 overflow-y-auto">
              <div className="space-y-6 pr-4">
                <div className="rounded-xl border p-6">
                  <h3 className="mb-2 font-semibold">Share Templates</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Save your share settings as templates for quick reuse.
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Security Settings Modal */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="text-primary h-5 w-5" />
              Security Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modal-password">Password Protection</Label>
              <Input
                id="modal-password"
                type="password"
                placeholder="Optional password"
                value={password || ''}
                onChange={(e) => setValue('password', e.target.value)}
                className="mt-2"
              />
              {errors.password && (
                <p className="text-destructive mt-1 text-sm">{errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="modal-maxViews">Max Views</Label>
              <Input
                id="modal-maxViews"
                type="number"
                placeholder="Unlimited"
                value={maxViews || ''}
                onChange={(e) => setValue('maxViews', parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="modal-expires">Expiration</Label>
              <Select value={expiresIn} onValueChange={(value) => setValue('expiresIn', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Never expires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-hours">1 Hour</SelectItem>
                  <SelectItem value="24-hours">24 Hours</SelectItem>
                  <SelectItem value="7-days">7 Days</SelectItem>
                  <SelectItem value="30-days">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="modal-slug">Custom URL Slug</Label>
              <Input
                id="modal-slug"
                placeholder="my-blueprint"
                value={customSlug || ''}
                onChange={(e) => setValue('customSlug', e.target.value)}
                className="mt-2"
              />
              {errors.customSlug && (
                <p className="text-destructive mt-1 text-sm">{errors.customSlug.message}</p>
              )}
            </div>
            <Button onClick={() => setSecurityOpen(false)} className="w-full">
              Apply Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-600" />
              Permissions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-download">Allow Download</Label>
              <Switch
                id="modal-download"
                checked={allowDownload}
                onCheckedChange={(checked) => setValue('allowDownload', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-print">Allow Print</Label>
              <Switch
                id="modal-print"
                checked={allowPrint}
                onCheckedChange={(checked) => setValue('allowPrint', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-copy">Allow Copy</Label>
              <Switch
                id="modal-copy"
                checked={allowCopy}
                onCheckedChange={(checked) => setValue('allowCopy', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-email">Require Email</Label>
              <Switch
                id="modal-email"
                checked={requireEmail}
                onCheckedChange={(checked) => setValue('requireEmail', checked)}
              />
            </div>
            {requireEmail && (
              <div>
                <Label htmlFor="modal-allowed-emails">Allowed Emails</Label>
                <Input
                  id="modal-allowed-emails"
                  placeholder="user@example.com, another@example.com"
                  {...register('allowedEmails')}
                  className="mt-2"
                />
              </div>
            )}
            <Button onClick={() => setPermissionsOpen(false)} className="w-full">
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customization Modal */}
      <Dialog open={customizationOpen} onOpenChange={setCustomizationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              Customization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modal-title">Custom Title</Label>
              <Input
                id="modal-title"
                placeholder={blueprintTitle}
                value={customTitle || ''}
                onChange={(e) => setValue('customTitle', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="modal-description">Custom Description</Label>
              <textarea
                id="modal-description"
                className="border-input bg-background mt-2 min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Add a description for social media previews..."
                value={customDescription || ''}
                onChange={(e) => setValue('customDescription', e.target.value)}
              />
            </div>
            <Button onClick={() => setCustomizationOpen(false)} className="w-full">
              Save Customization
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
