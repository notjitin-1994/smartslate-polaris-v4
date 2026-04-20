import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logDataExport } from '@/lib/utils/activityLogger';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Admin API: Export users data
 * POST /api/admin/users/export
 *
 * Body:
 * - format: 'csv' | 'excel' | 'pdf'
 * - filters: FilterConfig (search, role, tier, status, dateRange, usageRange)
 * - sortBy: string
 * - sortOrder: 'asc' | 'desc'
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { format = 'csv', filters = {}, sortBy = 'created_at', sortOrder = 'desc' } = body;

    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format', details: 'Format must be csv, excel, or pdf' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Fetch ALL users (no pagination for export)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !authData?.users) {
      console.error('[Export API] Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: authError?.message },
        { status: 500 }
      );
    }

    // Fetch ALL profiles
    const { data: allProfiles } = await supabase.from('user_profiles').select('*');

    // Create profiles map
    const profilesMap = new Map((allProfiles || []).map((p) => [p.user_id, p]));

    // Combine auth users with their profiles
    let allUsers = authData.users.map((authUser) => {
      const profile = profilesMap.get(authUser.id);

      return {
        user_id: authUser.id,
        email: authUser.email || 'unknown@example.com',
        full_name: profile?.full_name || authUser.user_metadata?.full_name || null,
        user_role: profile?.user_role || 'user',
        subscription_tier: profile?.subscription_tier || 'explorer',
        blueprint_creation_count: profile?.blueprint_creation_count || 0,
        blueprint_creation_limit: profile?.blueprint_creation_limit || 2,
        blueprint_saving_count: profile?.blueprint_saving_count || 0,
        blueprint_saving_limit: profile?.blueprint_saving_limit || 2,
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at || authUser.updated_at || authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at || null,
        deleted_at: profile?.deleted_at || null,
      };
    });

    // Apply filters (same logic as GET route)
    if (filters.search) {
      allUsers = allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          (u.full_name && u.full_name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (filters.role) {
      allUsers = allUsers.filter((u) => u.user_role === filters.role);
    }

    if (filters.tier) {
      allUsers = allUsers.filter((u) => u.subscription_tier === filters.tier);
    }

    if (filters.status && filters.status !== 'all') {
      allUsers = allUsers.filter((u) => {
        if (filters.status === 'deleted') return u.deleted_at;
        if (filters.status === 'active') return !u.deleted_at && u.last_sign_in_at;
        if (filters.status === 'inactive') return !u.deleted_at && !u.last_sign_in_at;
        return true;
      });
    }

    if (filters.dateRange) {
      const fromDate = new Date(filters.dateRange.start);
      const toDate = new Date(filters.dateRange.end);
      allUsers = allUsers.filter((u) => {
        const createdDate = new Date(u.created_at);
        return createdDate >= fromDate && createdDate <= toDate;
      });
    }

    if (filters.usageRange) {
      allUsers = allUsers.filter((u) => {
        const usagePercent =
          u.blueprint_creation_limit > 0
            ? (u.blueprint_creation_count / u.blueprint_creation_limit) * 100
            : 0;
        return usagePercent >= filters.usageRange.min && usagePercent <= filters.usageRange.max;
      });
    }

    // Apply sorting
    allUsers.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Log export activity
    await logDataExport(request, format, filters);

    // Generate export based on format
    if (format === 'csv') {
      return generateCSV(allUsers);
    } else if (format === 'excel') {
      return await generateExcel(allUsers);
    } else if (format === 'pdf') {
      return await generatePDF(allUsers);
    }

    return NextResponse.json({ error: 'Unknown format' }, { status: 400 });
  } catch (error) {
    console.error('Export API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'You do not have permission to export user data' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV export
 */
function generateCSV(users: any[]) {
  const headers = [
    'User ID',
    'Email',
    'Full Name',
    'Role',
    'Tier',
    'Creation Count',
    'Creation Limit',
    'Saving Count',
    'Saving Limit',
    'Usage %',
    'Joined',
    'Last Active',
    'Status',
  ];

  const rows = users.map((user) => {
    const usagePercent =
      user.blueprint_creation_limit > 0
        ? Math.round((user.blueprint_creation_count / user.blueprint_creation_limit) * 100)
        : 0;

    const status = user.deleted_at
      ? 'Deleted'
      : user.last_sign_in_at
        ? 'Active'
        : 'Never Logged In';

    return [
      user.user_id,
      user.email,
      user.full_name || 'N/A',
      user.user_role,
      user.subscription_tier,
      user.blueprint_creation_count,
      user.blueprint_creation_limit,
      user.blueprint_saving_count,
      user.blueprint_saving_limit,
      `${usagePercent}%`,
      new Date(user.created_at).toLocaleDateString(),
      user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
      status,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

/**
 * Generate Excel export with proper formatting
 */
async function generateExcel(users: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users', {
    properties: { tabColor: { argb: 'FF06B6D4' } },
  });

  // Define columns with proper widths
  worksheet.columns = [
    { header: 'User ID', key: 'user_id', width: 38 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Full Name', key: 'full_name', width: 25 },
    { header: 'Role', key: 'role', width: 12 },
    { header: 'Tier', key: 'tier', width: 15 },
    { header: 'Creation Count', key: 'creation_count', width: 15 },
    { header: 'Creation Limit', key: 'creation_limit', width: 15 },
    { header: 'Saving Count', key: 'saving_count', width: 13 },
    { header: 'Saving Limit', key: 'saving_limit', width: 13 },
    { header: 'Usage %', key: 'usage_percent', width: 10 },
    { header: 'Joined', key: 'joined', width: 15 },
    { header: 'Last Active', key: 'last_active', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF06B6D4' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // Add data rows
  users.forEach((user, index) => {
    const usagePercent =
      user.blueprint_creation_limit > 0
        ? Math.round((user.blueprint_creation_count / user.blueprint_creation_limit) * 100)
        : 0;

    const status = user.deleted_at
      ? 'Deleted'
      : user.last_sign_in_at
        ? 'Active'
        : 'Never Logged In';

    const row = worksheet.addRow({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name || 'N/A',
      role: user.user_role,
      tier: user.subscription_tier,
      creation_count: user.blueprint_creation_count,
      creation_limit: user.blueprint_creation_limit,
      saving_count: user.blueprint_saving_count,
      saving_limit: user.blueprint_saving_limit,
      usage_percent: `${usagePercent}%`,
      joined: new Date(user.created_at).toLocaleDateString(),
      last_active: user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString()
        : 'Never',
      status,
    });

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' },
      };
    }

    // Conditional formatting for usage percentage
    const usageCell = row.getCell('usage_percent');
    if (usagePercent >= 90) {
      usageCell.font = { color: { argb: 'FFEF4444' }, bold: true };
    } else if (usagePercent >= 70) {
      usageCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
    } else {
      usageCell.font = { color: { argb: 'FF10B981' } };
    }
  });

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}

/**
 * Generate PDF export with table formatting
 */
async function generatePDF(users: any[]) {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(6, 182, 212);
  doc.text('User Management Export', 14, 15);

  // Add metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Users: ${users.length}`, 14, 27);

  // Prepare table data
  const tableData = users.map((user) => {
    const usagePercent =
      user.blueprint_creation_limit > 0
        ? Math.round((user.blueprint_creation_count / user.blueprint_creation_limit) * 100)
        : 0;

    const status = user.deleted_at ? 'Deleted' : user.last_sign_in_at ? 'Active' : 'Inactive';

    return [
      user.email,
      user.full_name || 'N/A',
      user.user_role,
      user.subscription_tier,
      `${user.blueprint_creation_count}/${user.blueprint_creation_limit}`,
      `${usagePercent}%`,
      new Date(user.created_at).toLocaleDateString(),
      status,
    ];
  });

  // Add table
  autoTable(doc, {
    head: [['Email', 'Name', 'Role', 'Tier', 'Usage', '%', 'Joined', 'Status']],
    body: tableData,
    startY: 32,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [6, 182, 212],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 25 },
      7: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: function (data) {
      // Color code usage percentage
      if (data.column.index === 5 && data.section === 'body') {
        const value = parseInt(data.cell.text[0]);
        if (value >= 90) {
          data.cell.styles.textColor = [239, 68, 68]; // red
        } else if (value >= 70) {
          data.cell.styles.textColor = [245, 158, 11]; // orange
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // green
        }
      }
    },
  });

  // Add footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Generate buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  });
}
