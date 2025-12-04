# Azure VM Setup Guide for yusuf-curator-vm

## Your VM Details
- **DNS Name**: `yusuf-curator-vm.francecentral.cloudapp.azure.com`
- **Port**: `8000`
- **Full URL**: `http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000`

---

## ✅ Checklist: Is Your VM Ready?

Use this checklist to ensure your Azure VM is properly configured:

### 1. Network Security Group (NSG) - Port 8000
- [ ] Log into Azure Portal
- [ ] Navigate to your VM: `yusuf-curator-vm`
- [ ] Go to **Networking** → **Network Security Group**
- [ ] Add inbound rule:
  - **Port**: 8000
  - **Protocol**: TCP
  - **Source**: Any (or specific IP)
  - **Priority**: 100-1000
  - **Name**: "Allow-Port-8000"

### 2. API Server Running
- [ ] SSH into your VM
- [ ] Start your API server on port 8000
- [ ] Verify it's listening: `netstat -tuln | grep 8000`
- [ ] Keep it running (use `screen`, `tmux`, or systemd service)

### 3. Endpoint Configuration
Your server must have this endpoint:
```
GET /api/subscribed-chats
```

Example response:
```json
{
  "chats": [
    {
      "id": "1234567890@g.us",
      "name": "Community Group",
      "platform": "whatsapp",
      "type": "group"
    }
  ]
}
```

### 4. CORS Headers (CRITICAL!)
Your server MUST send these headers:
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 🔧 Server Implementation Examples

### Node.js/Express
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Or manually:
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Your endpoint
app.get('/api/subscribed-chats', async (req, res) => {
  try {
    // Fetch from your database
    const chats = await db.query('SELECT * FROM subscribed_chats WHERE active = true');
    
    res.json({
      chats: chats.map(chat => ({
        id: chat.chat_id,
        name: chat.chat_name,
        platform: chat.platform || 'whatsapp',
        type: chat.type || 'group'
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.listen(8000, '0.0.0.0', () => {
  console.log('Server running on port 8000');
  console.log('Endpoint: http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000/api/subscribed-chats');
});
```

### Python/Flask
```python
from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/subscribed-chats', methods=['GET'])
def get_subscribed_chats():
    try:
        # Fetch from your database
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT chat_id, chat_name, platform, type FROM subscribed_chats WHERE active = 1')
        
        chats = []
        for row in cursor.fetchall():
            chats.append({
                'id': row[0],
                'name': row[1],
                'platform': row[2] or 'whatsapp',
                'type': row[3] or 'group'
            })
        
        conn.close()
        return jsonify({'chats': chats})
    
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': 'Failed to fetch chats'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
```

### Python/FastAPI
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import sqlite3

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/subscribed-chats")
async def get_subscribed_chats():
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT chat_id, chat_name, platform, type FROM subscribed_chats WHERE active = 1')
        
        chats = [
            {
                'id': row[0],
                'name': row[1],
                'platform': row[2] or 'whatsapp',
                'type': row[3] or 'group'
            }
            for row in cursor.fetchall()
        ]
        
        conn.close()
        return {'chats': chats}
    
    except Exception as e:
        print(f'Error: {e}')
        return {'error': 'Failed to fetch chats'}, 500

# Run with: uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🧪 Testing Your VM

### Test from Command Line
```bash
# Test 1: Check if port is open
curl -v http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000/api/subscribed-chats

# Test 2: Check response format
curl http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000/api/subscribed-chats | jq

# Test 3: Check CORS headers
curl -I http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000/api/subscribed-chats
```

### Test from Browser
Open in browser:
```
http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000/api/subscribed-chats
```

You should see JSON response with your chats.

### Test from Your App
1. Open your Community Curator app
2. Go to **Settings**
3. Paste: `http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000`
4. Watch for:
   - ⏳ Saving...
   - 🔄 Connecting...
   - ✓ Connected - X chats (SUCCESS!)
   - OR ✗ Error with message (needs fixing)

---

## 🐛 Troubleshooting

### Error: "Connection failed: Failed to fetch"
**Cause**: Port not open or server not running
**Fix**: 
1. Check NSG rules in Azure Portal
2. Verify server is running: `netstat -tuln | grep 8000`
3. Restart server if needed

### Error: "Connection failed: CORS policy"
**Cause**: CORS not enabled
**Fix**: Add CORS headers to your server (see examples above)

### Error: "Connection failed: timeout"
**Cause**: Server not responding
**Fix**:
1. Check server logs for errors
2. Verify database connection
3. Test locally first: `curl localhost:8000/api/subscribed-chats`

### Error: "Invalid response format"
**Cause**: Response doesn't match expected format
**Fix**: Ensure response is:
```json
{
  "chats": [
    {"id": "...", "name": "...", "platform": "...", "type": "..."}
  ]
}
```

### Success Shows "0 chats"
**Cause**: Database is empty or query is wrong
**Fix**:
1. Check database has records
2. Verify SQL query
3. Check `active` flag is true

---

## 🔐 Security Recommendations

### For Production:
1. **Use HTTPS** instead of HTTP
   - Get SSL certificate (Let's Encrypt free)
   - Configure nginx/apache as reverse proxy
   - URL becomes: `https://yusuf-curator-vm.francecentral.cloudapp.azure.com:443`

2. **Add Authentication**
   - API key in header
   - JWT token
   - OAuth

3. **Restrict CORS**
   - Instead of `*`, specify allowed origins
   - `Access-Control-Allow-Origin: electron://your-app`

4. **Rate Limiting**
   - Prevent abuse
   - Limit requests per IP

5. **Firewall Rules**
   - Restrict port 8000 to specific IPs if possible
   - Use Azure NSG properly

### Example Secure Server:
```javascript
const express = require('express');
const app = express();

// API Key authentication
const API_KEY = process.env.API_KEY || 'your-secret-key';

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Restricted CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'your-app-origin');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  next();
});

// Your endpoint...
```

---

## 📋 Quick Start Checklist

Before using the app, verify:

- [ ] Azure NSG allows port 8000
- [ ] Server running on VM
- [ ] Endpoint `/api/subscribed-chats` exists
- [ ] CORS headers enabled
- [ ] Database has chat records
- [ ] Can access in browser: `http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000/api/subscribed-chats`
- [ ] Response format is correct JSON

Once all checked, paste this in your app:
```
http://yusuf-curator-vm.francecentral.cloudapp.azure.com:8000
```

---

## 🚀 Next Steps

1. **Set up your database** with subscribed chats
2. **Configure your API server** (use examples above)
3. **Open port 8000** in Azure NSG
4. **Start the server** on your VM
5. **Test with curl** or browser
6. **Paste URL in app** and watch it connect!

---

## 📞 Support

If you encounter issues:
1. Check server logs on VM
2. Check Azure NSG rules
3. Test endpoint manually
4. Verify database has data
5. Check CORS headers in browser dev tools (F12 → Network tab)

Your URL is correct - now just make sure your VM is configured properly!

