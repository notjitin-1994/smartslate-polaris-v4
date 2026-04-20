'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, DollarSign, Activity, Calendar, FileText } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  subscription_tier?: string;
  user_role?: string;
}

interface ApiLog {
  id: string;
  blueprint_id?: string;
  api_provider: string;
  model_id: string;
  endpoint: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost_cents: number;
  output_cost_cents: number;
  total_cost_cents: number;
  status: string;
  error_message?: string;
  request_duration_ms?: number;
  created_at: string;
}

interface CostData {
  user: UserProfile;
  totals: {
    totalCostCents: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalApiCalls: number;
  };
  groupedData: Record<string, any>;
  groupBy: string;
  dateRange: {
    from: string;
    to: string;
  };
  rawLogsCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UserCostDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'blueprint' | 'model'>('day');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const fetchUserCostData = async () => {
    setLoading(true);
    try {
      const url = new URL(`/api/admin/costs/${resolvedParams.userId}`, window.location.origin);
      url.searchParams.append('fromDate', dateRange.from);
      url.searchParams.append('toDate', dateRange.to);
      url.searchParams.append('groupBy', groupBy);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch user cost data');
      }

      const data = await response.json();
      setCostData(data);
    } catch (error) {
      console.error('Error fetching user cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCostData();
  }, [groupBy, dateRange]);

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTierBadgeVariant = (tier?: string) => {
    switch (tier) {
      case 'developer':
        return 'destructive';
      case 'enterprise':
        return 'default';
      default:
        return 'outline';
    }
  };

  const prepareChartData = () => {
    if (!costData?.groupedData) return [];

    if (groupBy === 'day') {
      return Object.entries(costData.groupedData)
        .map(([date, data]: [string, any]) => ({
          date: format(new Date(date), 'MMM dd'),
          cost: data.totalCostCents / 100,
          calls: data.apiCalls,
          tokens: data.totalInputTokens + data.totalOutputTokens,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (groupBy === 'model') {
      return Object.entries(costData.groupedData).map(([model, data]: [string, any]) => ({
        name: model.split('-').slice(0, 3).join('-'),
        value: data.totalCostCents / 100,
        calls: data.apiCalls,
        tokens: data.totalInputTokens + data.totalOutputTokens,
      }));
    } else {
      return Object.entries(costData.groupedData)
        .filter(([key]) => key !== 'no-blueprint')
        .map(([id, data]: [string, any]) => ({
          id,
          cost: data.totalCostCents / 100,
          calls: data.apiCalls,
          createdAt: data.blueprintDetails?.created_at,
        }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!costData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>No cost data available</p>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Cost Analysis</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-muted-foreground">
                {costData.user.first_name} {costData.user.last_name} • {costData.user.email}
              </p>
              <Badge variant={getTierBadgeVariant(costData.user.subscription_tier)}>
                {costData.user.subscription_tier}
              </Badge>
              {costData.user.user_role && (
                <Badge variant="secondary">{costData.user.user_role}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-md border px-3 py-2"
          />
          <span className="flex items-center">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-md border px-3 py-2"
          />
          <Button onClick={fetchUserCostData} variant="outline">
            Apply
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costData.totals.totalCostCents)}
            </div>
            <p className="text-muted-foreground text-xs">
              {dateRange.from} to {dateRange.to}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(costData.totals.totalApiCalls)}</div>
            <p className="text-muted-foreground text-xs">Total requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Input Tokens</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(costData.totals.totalInputTokens)}
            </div>
            <p className="text-muted-foreground text-xs">Prompt tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Output Tokens</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(costData.totals.totalOutputTokens)}
            </div>
            <p className="text-muted-foreground text-xs">Completion tokens</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day">Daily View</TabsTrigger>
          <TabsTrigger value="model">By Model</TabsTrigger>
          <TabsTrigger value="blueprint">By Blueprint</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Cost Trend</CardTitle>
              <CardDescription>API costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#8884d8"
                    name="Cost ($)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
              <CardDescription>Cost details by endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">API Calls</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead>Endpoints</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(costData.groupedData).map(([date, data]: [string, any]) => (
                    <TableRow key={date}>
                      <TableCell>{format(new Date(date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(data.totalCostCents)}
                      </TableCell>
                      <TableCell className="text-right">{data.apiCalls}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(data.totalInputTokens + data.totalOutputTokens)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(data.byEndpoint).map(
                            ([endpoint, info]: [string, any]) => (
                              <Badge key={endpoint} variant="secondary" className="text-xs">
                                {endpoint}: {info.calls}
                              </Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Model</CardTitle>
              <CardDescription>Distribution of costs across different AI models</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: $${entry.value.toFixed(2)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Usage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">API Calls</TableHead>
                    <TableHead className="text-right">Input Tokens</TableHead>
                    <TableHead className="text-right">Output Tokens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(costData.groupedData).map(([model, data]: [string, any]) => (
                    <TableRow key={model}>
                      <TableCell className="font-medium">{model}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{data.provider}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(data.totalCostCents)}
                      </TableCell>
                      <TableCell className="text-right">{data.apiCalls}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(data.totalInputTokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(data.totalOutputTokens)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blueprint" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Blueprint</CardTitle>
              <CardDescription>API costs for each blueprint generation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" tick={false} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="cost" fill="#8884d8" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blueprint Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blueprint ID</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">API Calls</TableHead>
                    <TableHead className="text-right">Tokens Used</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(costData.groupedData)
                    .filter(([key]) => key !== 'no-blueprint')
                    .map(([id, data]: [string, any]) => (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-sm">{id.substring(0, 8)}...</TableCell>
                        <TableCell>
                          {data.blueprintDetails?.created_at
                            ? format(
                                new Date(data.blueprintDetails.created_at),
                                'MMM dd, yyyy HH:mm'
                              )
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(data.totalCostCents)}
                        </TableCell>
                        <TableCell className="text-right">{data.apiCalls}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(data.totalInputTokens + data.totalOutputTokens)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              data.blueprintDetails?.status === 'completed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {data.blueprintDetails?.status || 'unknown'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
