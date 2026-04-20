'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Download, Filter } from 'lucide-react';

export function UserManagementHeader() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and subscription tiers</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-muted/50 rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Filters will be implemented here</p>
        </div>
      )}
    </div>
  );
}
