/**
 * Share Link Manager Component
 * Manage all share links for a blueprint in one place
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { ShareDialog } from './ShareDialog';
import {
  Share2,
  Copy,
  Eye,
  MessageSquare,
  Edit3,
  Lock,
  Clock,
  Users,
  MoreHorizontal,
  Trash2,
  BarChart3,
  ExternalLink,
  Download,
  Search,
  Filter,
  RefreshCw,
  QrCode,
  Settings,
  CheckSquare,
  Square,
  Link,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { ShareLink, SharePermissionLevel } from '@/types/share';
import { cn } from '@/lib/utils';

interface ShareLinkManagerProps {
  blueprintId: string;
  blueprintTitle: string;
  className?: string;
}

export function ShareLinkManager({
  blueprintId,
  blueprintTitle,
  className,
}: ShareLinkManagerProps) {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShares, setSelectedShares] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPermission, setFilterPermission] = useState<SharePermissionLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'expired' | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareToDelete, setShareToDelete] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadShares();
  }, [blueprintId]);

  const loadShares = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/share/list?blueprintId=${blueprintId}`);
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load share links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadShares();
    setRefreshing(false);
  };

  const copyShareLink = async (share: ShareLink) => {
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: 'Copied!',
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
    try {
      const response = await fetch(`/api/share/${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke share link');
      }

      setShares(shares.filter((s) => s.id !== shareId));
      toast({
        title: 'Share link revoked',
        description: 'The share link has been revoked successfully.',
      });
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke share link',
        variant: 'destructive',
      });
    }
    setDeleteDialogOpen(false);
    setShareToDelete(null);
  };

  const bulkRevoke = async () => {
    if (selectedShares.length === 0) return;

    try {
      await Promise.all(
        selectedShares.map((id) => fetch(`/api/share/${id}`, { method: 'DELETE' }))
      );

      setShares(shares.filter((s) => !selectedShares.includes(s.id)));
      setSelectedShares([]);
      toast({
        title: 'Share links revoked',
        description: `${selectedShares.length} share links have been revoked.`,
      });
    } catch (error) {
      console.error('Error revoking shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke some share links',
        variant: 'destructive',
      });
    }
  };

  const exportShares = () => {
    const data = filteredShares.map((share) => ({
      url: share.shareUrl,
      permission: share.permissionLevel,
      created: share.createdAt,
      views: share.viewCount,
      uniqueViewers: share.uniqueViewers,
      hasPassword: share.hasPassword,
      expiresAt: share.expiresAt,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `share-links-${blueprintId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPermissionIcon = (level: SharePermissionLevel) => {
    switch (level) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'edit':
        return <Edit3 className="h-4 w-4" />;
    }
  };

  const getPermissionColor = (level: SharePermissionLevel) => {
    switch (level) {
      case 'view':
        return 'text-blue-600 bg-blue-50';
      case 'comment':
        return 'text-yellow-600 bg-yellow-50';
      case 'edit':
        return 'text-red-600 bg-red-50';
    }
  };

  const isExpired = (share: ShareLink) => {
    return share.expiresAt && new Date(share.expiresAt) < new Date();
  };

  const isMaxViewsReached = (share: ShareLink) => {
    return share.maxViews ? share.viewCount >= share.maxViews : false;
  };

  // Filter shares
  const filteredShares = shares.filter((share) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !share.shareUrl.toLowerCase().includes(query) &&
        !share.customTitle?.toLowerCase().includes(query) &&
        !share.customDescription?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Permission filter
    if (filterPermission !== 'all' && share.permissionLevel !== filterPermission) {
      return false;
    }

    // Status filter
    if (filterStatus === 'active' && (isExpired(share) || !share.isActive)) {
      return false;
    }
    if (filterStatus === 'expired' && !isExpired(share)) {
      return false;
    }

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedShares.length === filteredShares.length) {
      setSelectedShares([]);
    } else {
      setSelectedShares(filteredShares.map((s) => s.id));
    }
  };

  const toggleSelect = (shareId: string) => {
    if (selectedShares.includes(shareId)) {
      setSelectedShares(selectedShares.filter((id) => id !== shareId));
    } else {
      setSelectedShares([...selectedShares, shareId]);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Share Links</CardTitle>
              <CardDescription>Manage all share links for "{blueprintTitle}"</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ShareDialog
                blueprintId={blueprintId}
                blueprintTitle={blueprintTitle}
                existingShares={shares}
                onShareCreated={(newShare) => setShares([newShare, ...shares])}
                trigger={
                  <Button>
                    <Share2 className="mr-2 h-4 w-4" />
                    Create Share Link
                  </Button>
                }
              />
              <Button variant="outline" size="icon" onClick={refresh} disabled={refreshing}>
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search share links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Permission
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterPermission('all')}>
                  All Permissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterPermission('view')}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPermission('comment')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Can Comment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPermission('edit')}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Can Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('expired')}>
                  Expired
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedShares.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedShares.length} selected</Badge>
                <Button variant="destructive" size="sm" onClick={bulkRevoke}>
                  Revoke Selected
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportShares}
              disabled={filteredShares.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : filteredShares.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {shares.length === 0 ? (
                <>
                  <Share2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>No share links created yet</p>
                </>
              ) : (
                <>
                  <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>No share links match your filters</p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedShares.length === filteredShares.length &&
                          filteredShares.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Share Link</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Security</TableHead>
                    <TableHead>Analytics</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShares.map((share) => (
                    <TableRow
                      key={share.id}
                      className={cn(
                        !share.isActive || isExpired(share) || isMaxViewsReached(share)
                          ? 'opacity-50'
                          : ''
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedShares.includes(share.id)}
                          onCheckedChange={() => toggleSelect(share.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link className="h-3 w-3 text-gray-400" />
                            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                              {share.shareSlug || share.shareToken.substring(0, 12)}...
                            </code>
                          </div>
                          {share.customTitle && (
                            <p className="text-xs text-gray-500">{share.customTitle}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('gap-1', getPermissionColor(share.permissionLevel))}>
                          {getPermissionIcon(share.permissionLevel)}
                          {share.permissionLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {share.hasPassword && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3" />
                            </Badge>
                          )}
                          {share.requireEmail && (
                            <Badge variant="outline" className="text-xs">
                              @
                            </Badge>
                          )}
                          {share.maxViews && (
                            <Badge variant="outline" className="text-xs">
                              {share.viewCount}/{share.maxViews}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="h-3 w-3 text-gray-400" />
                            <span>{share.viewCount}</span>
                            <Users className="h-3 w-3 text-gray-400" />
                            <span>{share.uniqueViewers}</span>
                          </div>
                          {share.lastViewedAt && (
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(share.lastViewedAt), {
                                addSuffix: true,
                              })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isExpired(share) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : isMaxViewsReached(share) ? (
                          <Badge variant="secondary">Max Views</Badge>
                        ) : !share.isActive ? (
                          <Badge variant="secondary">Revoked</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                        {share.expiresAt && !isExpired(share) && (
                          <p className="mt-1 text-xs text-gray-500">
                            Expires{' '}
                            {formatDistanceToNow(new Date(share.expiresAt), { addSuffix: true })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{format(new Date(share.createdAt), 'MMM d')}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(share.createdAt), 'h:mm a')}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyShareLink(share)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(share.shareUrl, '_blank')}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => window.open(`/share/${share.id}/analytics`, '_blank')}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              <Settings className="mr-2 h-4 w-4" />
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setShareToDelete(share.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The share link will be permanently revoked and will no
              longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShareToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => shareToDelete && revokeShare(shareToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
