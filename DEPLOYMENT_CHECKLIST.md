# Deployment Checklist - Vehicle Hire Features

## Files Created/Modified

### New Backend Files (Convex)
- ✅ `convex/incidents.ts` - Incident reporting API
- ✅ `convex/schema.ts` - Updated with `incidents` table

### New Frontend Files
- ✅ `src/routes/reports.tsx` - PDF reports generation page
- ✅ `src/routes/edit-vehicle.$vehicleId.tsx` - Vehicle editing page

### Modified Frontend Files
- ✅ `src/routes/session.$sessionId.tsx` - Added incident reporting UI
- ✅ `src/routes/my-vehicles.tsx` - Added Edit button to vehicle cards
- ✅ `src/components/layout/Sidebar.tsx` - Added Reports link for clients
- ✅ `src/lib/types.ts` - Added Incident types and enums

---

## Manual Verification Steps

### 1. Check Schema Syntax
```bash
# Verify no TypeScript errors in schema
cd /home/gerison/coding/vehicle-hire
npx tsc --noEmit convex/schema.ts
```

**Expected:** No output (success)

### 2. Check Incidents API
```bash
# Verify incidents.ts compiles
npx tsc --noEmit convex/incidents.ts
```

**Expected:** No output (success)

### 3. Check Frontend Files
```bash
# Verify TypeScript compilation of all new files
npx tsc --noEmit src/routes/reports.tsx
npx tsc --noEmit src/routes/edit-vehicle.$vehicleId.tsx  
npx tsc --noEmit src/routes/session.$sessionId.tsx
```

**Expected:** No output for each (success)

### 4. Deploy to Convex
```bash
# Start Convex dev server
npx convex dev
```

**Expected Output:**
```
▌ Developing against deployment:
▌  Local  Port 3210 • in ger-kim:vehicle-hire-337a0 (dashboard)
...
✔ Convex functions ready!
```

**What this does:**
- Pushes the new `incidents` table schema
- Updates the `notifications` type to include `incident_reported`
- Generates TypeScript types for all new functions

---

## Known Issues & Fixes Applied

### Issue 1: Import Typo in reports.tsx
**Fixed:** Changed `@tantml:router` to `@tanstack/react-router`

### Issue 2: jsPDF Version
**Status:** jsPDF 4.2.1 and jspdf-autotable 5.0.8 are installed in package.json
**Compatibility:** Code uses standard jsPDF API that works with v4.x

---

## Database Schema Changes

### New Table: `incidents`

```typescript
incidents: defineTable({
  sessionId: v.id("sessions"),
  clientId: v.id("users"),
  agentId: v.id("users"),
  vehicleId: v.id("vehicles"),
  title: v.string(),
  description: v.string(),
  severity: v.union(
    v.literal("minor"),
    v.literal("moderate"),
    v.literal("major")
  ),
  photos: v.array(v.string()),
  location: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
    })
  ),
  status: v.union(
    v.literal("reported"),
    v.literal("reviewing"),
    v.literal("resolved")
  ),
  resolutionNotes: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_session", ["sessionId"])
  .index("by_client", ["clientId"])
  .index("by_agent", ["agentId"])
  .index("by_vehicle", ["vehicleId"])
  .index("by_status", ["status"])
```

### Updated Type: `notifications`
Added `incident_reported` to the notification type union.

---

## New API Endpoints (convex/incidents.ts)

### Mutations:
1. `report()` - Create a new incident report
   - Args: sessionId, clientId, title, description, severity, photos, location
   - Returns: incidentId
   - Side effects: Creates notification for agent

2. `updateStatus()` - Update incident status (agent only)
   - Args: incidentId, agentId, status, resolutionNotes
   - Returns: void
   - Side effects: Creates notification for client

3. `generateUploadUrl()` - Get URL for photo uploads
   - Args: none
   - Returns: upload URL string

### Queries:
1. `getBySession()` - Get all incidents for a session
2. `getByClient()` - Get client's incident history
3. `getByAgent()` - Get agent's incident reports
4. `getById()` - Get single incident with full details

---

## Testing the Features

### Test 1: Vehicle Editing
1. Login as an agent
2. Navigate to "My Fleet"
3. Click "Edit" on any vehicle
4. Update details and save
5. Verify changes persist

### Test 2: Incident Reporting
1. Login as a client
2. Start an active rental session
3. Click "Report Incident" button
4. Fill in title, severity, description
5. Upload photos (optional)
6. Submit report
7. Verify agent receives notification
8. Agent can view incident and update status

### Test 3: PDF Reports
1. Login as client or agent
2. Navigate to "Reports" in sidebar
3. Select report type
4. Click "Download PDF Report"
5. Verify PDF downloads with correct data

---

## Rollback Plan

If deployment fails, rollback these changes:

### Revert Schema:
```bash
git checkout HEAD -- convex/schema.ts
```

### Remove New Files:
```bash
rm convex/incidents.ts
rm src/routes/reports.tsx
rm src/routes/edit-vehicle.\$vehicleId.tsx
```

### Revert Modified Files:
```bash
git checkout HEAD -- src/routes/session.\$sessionId.tsx
git checkout HEAD -- src/routes/my-vehicles.tsx
git checkout HEAD -- src/components/layout/Sidebar.tsx
git checkout HEAD -- src/lib/types.ts
```

---

## Post-Deployment Verification

After successful `npx convex dev`:

### 1. Check Generated Types
```bash
# Verify api.d.ts includes new functions
grep -r "incidents" convex/_generated/api.d.ts
```

**Expected:** Should find incident functions listed

### 2. Check Data Model
```bash
# Verify dataModel includes incidents table
grep "incidents" convex/_generated/dataModel.d.ts
```

**Expected:** Should find `Id<"incidents">` and `Doc<"incidents">`

### 3. Test Frontend Build
```bash
npm run build
```

**Expected:** Build completes without errors

---

## Environment Variables

No new environment variables required. All features use existing:
- `VITE_CONVEX_URL` - Convex deployment URL
- Existing auth configuration

---

## Dependencies

All required dependencies are already in package.json:
- `jspdf` v4.2.1
- `jspdf-autotable` v5.0.8  
- `convex` v1.41.0
- All React and routing dependencies

---

## Support

For issues during deployment:

1. **Schema validation errors:** Check convex/schema.ts syntax
2. **Type errors:** Run `npx tsc --noEmit` to find specific errors
3. **Import errors:** Verify all imports reference correct paths
4. **Convex connection:** Check `.env.local` has correct `VITE_CONVEX_URL`

---

## Success Criteria

Deployment is successful when:
- ✅ `npx convex dev` starts without errors
- ✅ All three features are accessible in the UI
- ✅ Incident reports can be created and viewed
- ✅ Vehicles can be edited by their owners
- ✅ PDF reports can be generated and downloaded
- ✅ No TypeScript compilation errors
- ✅ No console errors in browser

---

**Last Updated:** 2026-08-04
**Status:** Ready for Deployment
