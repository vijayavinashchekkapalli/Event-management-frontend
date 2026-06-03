# PRODUCTION DEPLOYMENT GUIDE - LOAD TEST RECOVERY

## ⚠️ PRE-DEPLOYMENT REQUIREMENTS

### Required Verifications:
- [ ] All tests in TESTING_GUIDE_LOAD_RECOVERY.md passed
- [ ] Memory usage stable (< 80% of limit)
- [ ] No console errors in logs
- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] Backup of current database taken
- [ ] Team notified of deployment

---

## DEPLOYMENT STRATEGY: ZERO-DOWNTIME

### Option A: Blue-Green Deployment (Recommended)
```
1. Deploy to new server (green)
2. Run tests on green
3. Switch traffic to green
4. Keep blue as fallback
5. Monitor green for 24 hours
6. Decommission blue if stable
```

### Option B: Staged Rollout
```
1. Deploy to 25% of users
2. Monitor for 4 hours
3. Deploy to 50% of users
4. Monitor for 4 hours
5. Deploy to 100% of users
6. Monitor for 24 hours
```

### Option C: Canary Deployment
```
1. Deploy to 5-10 users
2. Monitor metrics
3. Gradually increase to 100%
4. Rollback if issues detected
```

---

## DEPLOYMENT STEPS

### Step 1: Pre-Deployment Backup
```bash
# Backup database
mongodump --uri="mongodb+srv://..." --out=./backups/pre-recovery-backup

# Backup current code
git tag backup-pre-recovery
git branch backup-pre-recovery

# Verify backup
ls -la ./backups/pre-recovery-backup
```

### Step 2: Code Deployment
```bash
# On production server
cd /var/www/event-management/backend

# Stop server gracefully
pm2 stop all
sleep 10

# Pull latest code
git pull origin main  # or your branch

# Install dependencies
npm install

# Verify no build errors
npm list

# Check for syntax errors
node --check server.js
```

### Step 3: Database Migration
```bash
# Create indexes (idempotent - safe to run multiple times)
mongosh << 'EOF'
// Connect to database
use event_management

// Users indexes
db.users.createIndex({username: 1, isAdmin: 1})
db.users.createIndex({email: 1, isAdmin: 1})
db.users.createIndex({phone: 1, isAdmin: 1})

// Teams indexes
db.teams.createIndex({userId: 1, registrationStatus: 1})
db.teams.createIndex({stream: 1, year: 1, registrationStatus: 1})
db.teams.createIndex({registrationStatus: 1, createdAt: -1})

// Issues indexes
db.issues.createIndex({userId: 1, status: 1})
db.issues.createIndex({teamId: 1, status: 1})
db.issues.createIndex({status: 1, issueType: 1, createdAt: -1})

// Verify
db.users.getIndexes().length
db.teams.getIndexes().length
db.issues.getIndexes().length

EOF
```

### Step 4: Environment Configuration
```bash
# Update .env with optimized settings
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/event_management
MONGO_MAX_POOL_SIZE=100
MONGO_MIN_POOL_SIZE=10

# JWT
JWT_SECRET=your-super-secret-key-change-this

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Cloudinary
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Dashboard cache (seconds)
DASHBOARD_CACHE_TTL_SECONDS=60

EOF

# Verify .env
cat .env  # Check all values are set
```

### Step 5: Start Server with PM2
```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start server with ecosystem.config.js
pm2 start ecosystem.config.js --name "event-management"

# Verify it's running
pm2 status

# Expected:
# ┌─────┬──────────────────┬─────────┬─────────┬──────────┬────────┐
# │ id  │ name             │ version │ pm_id   │ status   │ memory │
# ├─────┼──────────────────┼─────────┼─────────┼──────────┼────────┤
# │ 0   │ event-management │ 1.0.0   │ 12345   │ online   │ 65 MB  │
# └─────┴──────────────────┴─────────┴─────────┴──────────┴────────┘

# View logs
pm2 logs event-management --lines 50
```

### Step 6: Verify Deployment
```bash
# Test health check
curl http://localhost:5000/api/banner -i

# Expected: 200 OK with banners

# Test with domain
curl https://your-domain.com/api/banner -i

# Check memory
pm2 monit

# Check logs for errors
pm2 logs event-management | grep ERROR
```

### Step 7: Run Post-Deployment Tests
```bash
# Terminal 1: Watch logs
pm2 logs event-management

# Terminal 2: Run tests
bash TESTING_GUIDE_LOAD_RECOVERY.md  # Run critical tests

# Expected: All tests pass
```

### Step 8: Enable Auto-Restart
```bash
# Start on system boot
pm2 startup

# Save PM2 config
pm2 save

# Verify
pm2 list

# Kill process and verify it auto-restarts
pm2 kill
sleep 5
pm2 list  # Should show restarted processes
```

---

## MONITORING POST-DEPLOYMENT

### Real-time Monitoring (First 24 Hours)
```bash
# Terminal 1: Watch PM2
watch -n 5 'pm2 list'

# Terminal 2: Watch logs
pm2 logs event-management --lines 100

# Terminal 3: Monitor system
watch -n 5 'free -h && ps aux | grep node'
```

### Metrics to Monitor
- ✅ Memory usage (should stay < 80%)
- ✅ CPU usage (should be < 50%)
- ✅ Error rate (should be 0%)
- ✅ Response time (should be consistent)
- ✅ Database connections (should be stable)
- ✅ Request throughput (should be normal)

### Alerting Configuration
```bash
# Set up alerts in PM2
pm2 web  # Web dashboard: http://localhost:9615

# Or use CloudWatch/DataDog/New Relic
# Configure alerts for:
# - Memory > 80%
# - Error rate > 1%
# - Response time > 5s
# - Process exit code != 0
```

---

## ROLLBACK PROCEDURE

### If Issues Detected (< 30 minutes)
```bash
# Stop current deployment
pm2 stop all

# Revert code
git checkout backup-pre-recovery

# Reinstall dependencies
npm install

# Restart
pm2 start ecosystem.config.js

# Verify
curl http://localhost:5000/api/banner -i

# Monitor
pm2 logs event-management
```

### If Issues Not Detected Initially (> 30 minutes)
```bash
# Keep current version running
# Investigate logs for errors

pm2 logs event-management | grep ERROR

# If recoverable: Apply hotfix
# If critical: Use backup

# Restore from backup (if needed)
mongorestore --uri="mongodb+srv://..." ./backups/pre-recovery-backup
```

---

## POST-DEPLOYMENT CHECKLIST (24 HOURS)

### Hour 1
- [ ] Monitor memory usage
- [ ] Check error logs
- [ ] Verify API response times
- [ ] Test all major features
- [ ] Confirm database connections

### Hour 2-4
- [ ] Monitor under regular traffic
- [ ] Check background jobs
- [ ] Verify email functionality
- [ ] Test admin panel
- [ ] Confirm registrations work

### Hour 4-12
- [ ] Monitor overnight traffic patterns
- [ ] Check for memory leaks
- [ ] Verify scheduled tasks
- [ ] Review error logs
- [ ] Monitor database performance

### Hour 12-24
- [ ] Analyze full day metrics
- [ ] Compare with pre-deployment baseline
- [ ] Check peak traffic handling
- [ ] Verify cache hit rates
- [ ] Confirm no issues reported

### Final Sign-Off
- [ ] All systems operating normally
- [ ] Performance improved
- [ ] No critical errors
- [ ] Memory stable
- [ ] Ready for full production

---

## PERFORMANCE BASELINE

### Before Deployment
```
Signup Latency: 7545ms
Login Latency: 6917ms
Banner Load: "Loading..." (frozen)
Error Rate: 0.5%
Memory Usage: 90%
```

### Expected After Deployment
```
Signup Latency: < 2000ms
Login Latency: < 2000ms
Banner Load: < 500ms
Error Rate: 0%
Memory Usage: 65%
```

### Success Criteria
- ✅ Response times improved by 75%+
- ✅ Error rate reduced to 0%
- ✅ Memory usage reduced by 25%+
- ✅ No user complaints
- ✅ All automated tests pass

---

## COMMUNICATION TEMPLATE

### Pre-Deployment Notification
```
Subject: Scheduled Maintenance - Event Management System

Dear Users,

We will be performing a major system upgrade on [DATE] from [TIME] to [TIME].

Changes:
- Performance improvements
- Better load handling
- Improved stability

Impact:
- System will be unavailable for 15-30 minutes
- No data will be lost
- Recommending not submitting forms during maintenance

Apologies for the inconvenience.
```

### Post-Deployment Notification
```
Subject: System Upgrade Complete ✅

Dear Users,

We have successfully completed our system upgrade. The platform is now:

✅ Faster (75% improvement)
✅ More stable
✅ Better handling of traffic
✅ Improved security

If you experience any issues, please contact support.

Thank you for your patience.
```

---

## TROUBLESHOOTING DURING DEPLOYMENT

### Issue: Connection Timeout
```bash
# Check if server is running
curl http://localhost:5000/api/banner

# Check firewall rules
sudo iptables -L -n | grep 5000

# Check port is open
netstat -tuln | grep 5000
```

### Issue: Database Connection Error
```bash
# Test MongoDB connection
mongosh "mongodb+srv://..."

# Check credentials in .env
grep MONGO_URI .env

# Verify IP whitelist in MongoDB Atlas
# Add server IP to whitelist
```

### Issue: High Memory Usage
```bash
# Check heap size
node --max_old_space_size=4096 server.js

# Monitor memory
watch -n 1 'ps aux | grep node'

# Find memory leak
node --inspect server.js
# Open chrome://inspect
```

### Issue: Indexes Not Created
```bash
# Create manually
mongosh << 'EOF'
use event_management
db.users.createIndex({username: 1, isAdmin: 1})
# ... etc
EOF
```

---

## SUPPORT CONTACTS

- **DevOps**: [Contact]
- **Database Admin**: [Contact]
- **System Admin**: [Contact]
- **On-Call Engineer**: [Contact]

---

## SUCCESS CONFIRMATION

After 24 hours of stable operation:

```
✅ Deployment Status: SUCCESS
✅ All systems operational
✅ Performance targets met
✅ No critical errors
✅ Ready for next release
```

**Signed off by**: ________________
**Date**: ________________
**Time**: ________________

