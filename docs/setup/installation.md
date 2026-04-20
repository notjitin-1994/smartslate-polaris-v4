# Installation Guide

> **Complete Setup for SmartSlate Polaris v3**
> Estimated Time: 15-20 minutes

---

## 🎯 Prerequisites

### **System Requirements**
- **Node.js**: >= 18.17.0 (LTS recommended)
- **npm**: >= 9.0.0
- **Git**: Latest version
- **PostgreSQL Client**: For local database management (optional)

### **Required Accounts & API Keys**
- **Supabase Account**: [Create free account](https://app.supabase.com)
- **Anthropic Account**: [Get Claude API key](https://console.anthropic.com/settings/keys)
- **Git Repository**: Access to the polaris-v3 repository

### **Development Tools (Recommended)**
- **VS Code**: With these extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint
- **Postman**: For API testing
- **Docker Desktop**: For local development (optional)

---

## 🚀 Quick Installation

### **1. Clone and Setup Repository**
```bash
# Clone the repository
git clone https://github.com/yourusername/polaris-v3.git
cd polaris-v3

# Install root dependencies
npm install

# Navigate to frontend and install dependencies
cd frontend
npm install

# Navigate back to root for database setup
cd ..
```

### **2. Environment Configuration**
```bash
# Create environment file
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` with your configuration:
```env
# ========================================
# Supabase Configuration (Required)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ========================================
# AI Providers (Required)
# ========================================
ANTHROPIC_API_KEY=sk-ant-your-claude-api-key

# ========================================
# Application Configuration
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### **3. Database Setup**
```bash
# From project root - Start local Supabase
npm run supabase start

# Apply database migrations
npm run supabase migration up

# Or deploy to remote Supabase
npm run db:push
```

### **4. Start Development Server**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Detailed Setup Instructions

### **Step 1: Supabase Project Setup**

#### **Create Supabase Project**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name**: `polaris-v3-dev`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

#### **Get API Keys**
1. In your Supabase project, go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJ...` (starts with `eyJ`)
   - **service_role**: `eyJ...` (starts with `eyJ`)

#### **Configure Database**
1. Go to **Settings** → **Database**
2. Note your **Database Password** (save it securely)
3. **Connection string** will be: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### **Step 2: Anthropic API Setup**

#### **Get Claude API Key**
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Give it a descriptive name: `polaris-v3-development`
5. Copy the key (starts with `sk-ant-`)
6. Add billing method (required for API access)

#### **Test API Key**
```bash
# Test your API key (replace YOUR_KEY)
curl -X POST https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ant-YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### **Step 3: Database Migrations**

#### **Using Supabase CLI (Recommended for Development)**
```bash
# Install Supabase CLI (if not installed)
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations from supabase/migrations/
npm run db:push
```

#### **Migration Files Location**
```
supabase/migrations/
├── 0001_initial_schema.sql
├── 0002_user_profiles.sql
├── 0003_blueprint_generator.sql
├── 0004_rls_policies.sql
└── 0005_functions_triggers.sql
```

#### **Manual Migration (if CLI fails)**
1. Go to Supabase Dashboard → **SQL Editor**
2. Run each migration file in order
3. Start with `0001_initial_schema.sql` and work sequentially

### **Step 4: Environment Configuration Details**

#### **Complete .env.local File**
```env
# ========================================
# Supabase Configuration (Required)
# ========================================
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role...

# ========================================
# AI Providers (Required)
# ========================================
# Get from: Anthropic Console → API Keys
ANTHROPIC_API_KEY=sk-ant-your-claude-api-key

# ========================================
# Application Configuration
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ========================================
# Optional Configuration
# ========================================
# For local development with Ollama (optional)
OLLAMA_BASE_URL=http://localhost:11434

# Database connection (for scripts)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase connection (for scripts)
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### **Environment Variable Security**
- ✅ Store `.env.local` in `.gitignore` (already done)
- ✅ Never commit real API keys
- ✅ Use different keys for development/production
- ✅ Rotate keys if accidentally exposed

### **Step 5: Verify Installation**

#### **Check Database Connection**
```bash
# From project root
cd frontend
npm run typecheck
```

#### **Test API Endpoints**
```bash
# Start the development server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3000/api/health
```

#### **Verify Frontend**
1. Open [http://localhost:3000](http://localhost:3000)
2. Should see the landing page
3. Navigate to `/auth/signup`
4. Should be able to create an account
5. Check Supabase Dashboard → **Authentication** → **Users** to verify

---

## 🔧 Development Setup Verification

### **1. Database Verification**
```sql
-- Connect to your Supabase database and run:
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

You should see tables:
- `user_profiles`
- `blueprint_generator`
- `auth.users` (Supabase auth table)

### **2. API Verification**
```bash
# Test auth endpoint
curl -X POST http://localhost:3000/api/test-auth \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### **3. Frontend Verification**
```bash
# Check for TypeScript errors
cd frontend
npm run typecheck

# Check for linting issues
npm run lint

# Run tests
npm run test
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **"Database connection failed"**
```bash
# Check Supabase is running
npm run supabase status

# Restart local Supabase
npm run db:reset

# Check environment variables
cat frontend/.env.local | grep SUPABASE
```

#### **"Anthropic API key invalid"**
- Verify key starts with `sk-ant-`
- Check billing is set up in Anthropic console
- Test API key with curl command above
- Ensure no extra spaces in `.env.local`

#### **"TypeScript errors"**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **"RLS policies not working"**
- Verify migrations were applied: `npm run db:status`
- Check user is authenticated: `console.log(supabase.auth.getUser())`
- Review RLS policies in Supabase Dashboard

#### **"Port 3000 already in use"**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]

# Or use different port
npm run dev -- -p 3001
```

### **Getting Help**

1. **Check logs**: `npm run dev` shows detailed error messages
2. **Database logs**: Supabase Dashboard → **Logs**
3. **API testing**: Use Postman or curl to test endpoints
4. **Community**: GitHub Issues for bug reports

---

## 📱 Development Workflow

### **Day-to-Day Development**
```bash
# 1. Start development server
cd frontend
npm run dev

# 2. In another terminal, watch for file changes
npm run test:watch

# 3. Make changes, test, and commit
git add .
git commit -m "feat: add new feature"
git push
```

### **Database Changes**
```bash
# 1. Create new migration
npm run db:migrations:new add_new_feature

# 2. Edit the migration file
# supabase/migrations/0006_add_new_feature.sql

# 3. Apply migration
npm run db:push

# 4. Test changes locally
npm run db:reset  # Reset to clean state
```

### **Working with Environment Variables**
```bash
# Development uses .env.local
# Production uses Vercel environment variables

# Test production variables locally
cp .env.example .env.production.local
# Edit with production values
npm run build
npm run start
```

---

## 🚀 Production Deployment Setup

### **Vercel Deployment**
1. **Connect GitHub Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub
   - Select `polaris-v3` repository

2. **Configure Build Settings**:
   ```json
   {
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/.next",
     "installCommand": "cd frontend && npm install"
   }
   ```

3. **Add Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`

4. **Deploy**:
   - Push to main branch
   - Vercel automatically deploys

### **Environment-Specific Configuration**
```bash
# Development (.env.local)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Staging (Vercel Preview)
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Production (Vercel Production)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.com
```

---

## ✅ Installation Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Anthropic API key obtained
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Development server running
- [ ] Can create user account
- [ ] Can access dashboard
- [ ] API endpoints responding
- [ ] Tests passing

---

**Estimated Total Time**: 15-20 minutes
**Support**: Check [Developer Guide](../../CLAUDE.md) for development patterns
**Issues**: Report on [GitHub Issues](https://github.com/yourusername/polaris-v3/issues)

**Last Updated**: January 2025