# Quick Reference Guide - Independent Auth System

## 🚀 Quick Start

### Install & Build
```bash
npm install
npm run build
npm run dev  # or npm start for production
```

### Test Health Endpoint
```bash
curl http://localhost:5000/health
# {"status":"ok","timestamp":"...","auth":"independent","node":"v..."}
```

---

## 📝 API Endpoints Reference

### Authentication Endpoints

#### POST /api/auth/signup
**Register new user**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "role": "user",
    "status": "pending"
  },
  "token": "eyJhbGc..."
}
```
**Cookies Set:** `auth_token` (access), `refresh_token` (refresh)

---

#### POST /api/auth/login
**Login user**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```
**Response:** Same as signup
**Cookies Set:** `auth_token`, `refresh_token`

---

#### GET /api/auth/me
**Get current user**
```bash
curl http://localhost:5000/api/auth/me \
  -b "auth_token=<your-token>"
```
**Response:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "status": "pending"
}
```

---

#### POST /api/auth/refresh
**Refresh access token**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -b "refresh_token=<your-refresh-token>"
```
**Response:**
```json
{
  "token": "eyJhbGc..."
}
```
**New Cookie:** `auth_token` updated

---

#### POST /api/auth/logout
**Logout user**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b "auth_token=<your-token>"
```
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```
**Cookies Cleared:** `auth_token`, `refresh_token`

---

## 💻 Frontend Integration

### Setup (React/TypeScript)

**Create API client:**
```typescript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = {
  async signup(email: string, password: string, firstName: string, lastName: string) {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      credentials: 'include',  // ⭐ IMPORTANT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName })
    });
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',  // ⭐ IMPORTANT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include'  // ⭐ IMPORTANT
    });
    return res.json();
  },

  async logout() {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'  // ⭐ IMPORTANT
    });
  },

  async protectedRequest(path: string, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include'  // ⭐ IMPORTANT
    });
    return res.json();
  }
};
```

### Usage in Components

**Login Component:**
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const { user, token } = await apiClient.login(email, password);
    setCurrentUser(user);
    setToken(token);
    navigate('/dashboard');
  } catch (error) {
    setError(error.message);
  }
};
```

**Protected Route:**
```typescript
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getMe()
      .then(u => setUser(u))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};
```

**Dashboard (Protected Request):**
```typescript
const Dashboard = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    apiClient.protectedRequest('/api/dashboard-config')
      .then(setConfig)
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  return <div>...</div>;
};
```

---

## 🔐 Backend Middleware Usage

### Protect Routes

**Basic protection:**
```typescript
app.get('/api/protected', authenticate, async (req, res) => {
  const userId = req.userId;  // Set by authenticate middleware
  const user = await storage.getUser(userId);
  res.json(user);
});
```

**Admin-only route:**
```typescript
app.get('/api/admin/users', authenticate, authenticateAdmin, async (req, res) => {
  const users = await storage.getAllUsers();
  res.json(users);
});
```

**Optional auth (guest allowed but user info available):**
```typescript
app.get('/api/content', authenticateOptional, async (req, res) => {
  let content = getPublicContent();
  if (req.userId) {
    const user = await storage.getUser(req.userId);
    content = getPersonalizedContent(user);
  }
  res.json(content);
});
```

---

## 🗄️ Storage Methods Reference

```typescript
// Get user by ID
const user = await storage.getUser(userId);

// Get user by email
const user = await storage.getUserByEmail('user@example.com');

// Create new user
const newUser = await storage.createUser({
  email: 'new@example.com',
  passwordHash: hashedPassword,  // Use hashPassword() from independentAuth
  firstName: 'John'
});

// Update user
await storage.updateUser(userId, {
  firstName: 'Jane',
  displayName: 'Dr. Jane Doe'
});

// Get all users (admin only)
const users = await storage.getAllUsers();

// Update user status
await storage.updateUserStatus(userId, 'active');  // or 'pending', 'blocked'

// Update user role
await storage.updateUserRole(userId, 'admin');

// Activate with subscription
await storage.activateUserWithSubscription(userId, expiryDate);

// Update user state
await storage.updateUserUf(userId, 'SP');  // State code
await storage.updateUserChatTerms(userId);  // Mark as accepted
```

---

## 🔑 Environment Variables

### Required (in production)
```bash
DATABASE_URL=postgresql://user:password@host:5432/db
NODE_ENV=production
PORT=5000
```

### Optional (will use defaults in development)
```bash
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

### Generate Secrets
```bash
# In Node REPL or bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output to JWT_SECRET
# Run again for JWT_REFRESH_SECRET
```

---

## 🧪 Testing

### Using cURL

**Create Account:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Check Current User:**
```bash
curl http://localhost:5000/api/auth/me \
  -b cookies.txt
```

**Access Protected Route:**
```bash
curl http://localhost:5000/api/dashboard-config \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

### Using Postman

1. **Create Signup Request**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/signup`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "Test123!",
       "firstName": "Test"
     }
     ```

2. **Enable Cookie Jar**
   - Postman will automatically store cookies
   - All subsequent requests will include them

3. **Test Protected Route**
   - Method: GET
   - URL: `http://localhost:5000/api/dashboard-config`
   - Cookies are automatically included

---

## 🐛 Troubleshooting

### "Unauthorized" on protected routes
**Problem:** Auth cookie not being sent
**Solution:** Add `credentials: 'include'` to fetch options
```typescript
fetch(url, {
  credentials: 'include'  // ← Add this line
})
```

### Cookies not persisting
**Problem:** Frontend and backend on different domains/protocols
**Solution:** Same domain or configure CORS properly
```typescript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true  // ← Important
}));
```

### "Invalid token" errors
**Problem:** JWT_SECRET changed or token corrupted
**Solution:** Logout and login again to get new token

### CORS errors
**Problem:** Browser blocking requests
**Solution:** Ensure CORS is configured in Express
```typescript
import cors from 'cors';
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│       Browser / Frontend App            │
├─────────────────────────────────────────┤
│   Sends:  Email + Password              │
│   Receives: JWT Token + User Data       │
└──────────────┬──────────────────────────┘
               │
       HTTP + Cookie Header
               │
               ▼
┌─────────────────────────────────────────┐
│    Express API Server                   │
├─────────────────────────────────────────┤
│  /api/auth/signup                       │
│  /api/auth/login    ← Validates Password│
│  /api/auth/logout   ← Hashes Password   │
│  /api/auth/me                           │
│  /api/auth/refresh                      │
└──────────────┬──────────────────────────┘
               │
          SQL Queries
               │
               ▼
┌─────────────────────────────────────────┐
│    PostgreSQL Database                  │
├─────────────────────────────────────────┤
│   users table:                          │
│   - id (UUID)                           │
│   - email (unique)                      │
│   - passwordHash (bcrypt)               │
│   - firstName, lastName                 │
│   - role, status                        │
│   - subscriptionExpiresAt               │
└─────────────────────────────────────────┘
```

---

## 🔒 Security Notes

1. **Never store passwords in plain text**
   - Always use `hashPassword()` from independentAuth module

2. **Always use credentials: 'include'**
   - Required for cookies to be sent with requests

3. **HttpOnly cookies**
   - Cannot be accessed by JavaScript
   - Prevents XSS attacks on auth tokens

4. **HTTPS in production**
   - Cookies have secure flag (HTTPS only)
   - Use proper SSL certificates

5. **JWT tokens expire**
   - Access: 15 minutes
   - Refresh: 7 days
   - Use /api/auth/refresh to get new access token

---

## 📚 Related Documentation

- [AUTH_MIGRATION_COMPLETE.md](AUTH_MIGRATION_COMPLETE.md) - Full migration details
- [MIGRATION_IMPLEMENTATION_REPORT.md](MIGRATION_IMPLEMENTATION_REPORT.md) - Implementation report
- [server/auth/independentAuth.ts](server/auth/independentAuth.ts) - Source code
- [server/storage.ts](server/storage.ts) - Database layer

---

## 🆘 Need Help?

### Check Logs
```bash
# View server logs
npm run dev  # Shows all logs

# Check specific error
tail -f logs/error.log
```

### Test Health Endpoint
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","auth":"independent",...}
```

### Verify Database
```bash
psql $DATABASE_URL -c "SELECT * FROM users LIMIT 1;"
```

### Check Environment
```bash
echo $JWT_SECRET
echo $DATABASE_URL
echo $NODE_ENV
```

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready ✅
