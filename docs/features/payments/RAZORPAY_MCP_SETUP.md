# Razorpay MCP Server Setup Guide

## ✅ Setup Complete

Your Razorpay MCP server has been successfully installed and configured.

## Configuration Files Updated

- **Claude Code**: `/home/jitin-m-nair/Desktop/polaris-v3/.mcp.json`
- **Cursor**: `/home/jitin-m-nair/Desktop/polaris-v3/.cursor/mcp.json`

## ✅ Credentials Configured

Your live Razorpay credentials have been automatically configured:

- **Key ID**: `rzp_live_RZ1LKPIgiJbMuy`
- **Key Secret**: `jbXD0c08wHQz4L0WXSwf3RG5`

⚠️ **Live Mode**: You're using live Razorpay keys that will process REAL payments. All operations will affect your production data.

## 🛠 Available Razorpay Tools

Once configured, you can use these tools in Claude Code:

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `getAllPayments` | Fetch payments with pagination | "Get all payments from last month" |
| `getAllOrders` | Fetch orders with pagination | "Show me recent orders" |
| `getAllSettlements` | Fetch settlements | "Get settlement details" |
| `getAllRefunds` | Fetch refunds | "List recent refunds" |
| `getAllDisputes` | Fetch disputes | "Check for payment disputes" |
| `getAllInvoices` | Fetch invoices | "Show generated invoices" |
| `getAllContacts` | Fetch contacts | "List customer contacts" |
| `getAllTransactions` | Fetch transactions | "Get transaction history" |
| `getAllVPAs` | Fetch Virtual Payment Addresses | "List UPI VPAs" |
| `getAllCustomers` | Fetch customers | "Get customer database" |
| `getAccountBalance` | Fetch account balance | "Check account balance" |

## 🚀 Usage Examples

Start using the Razorpay tools naturally:

```bash
"Show me the last 10 payments"
"Get all orders from this month"
"Check my account balance"
"Find any payment disputes"
"List all customers"
```

## 🔒 Security Notes

- ✅ Your configuration files are protected by `.gitignore`
- ✅ Never commit actual API keys to version control
- ✅ Use test keys for development
- ✅ Keep your keys secure and rotate them regularly

## 🆘 Troubleshooting

If the Razorpay tools don't work:

1. **Check your credentials**: Ensure Key ID and Key Secret are correct
2. **Restart Claude Code**: Restart to reload MCP configuration
3. **Verify network connection**: Ensure you can access Razorpay APIs
4. **Check key permissions**: Make sure your keys have the required permissions

## 📚 Additional Resources

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- Package: `razorpay-mcp@0.1.5`

---

**Status**: ✅ Ready to use (credentials configured)
**Last Updated**: October 2025