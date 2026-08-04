#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "Vehicle Hire - Deployment Verification Script"
echo "================================================"
echo ""

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NOT FOUND"
        return 1
    fi
}

# Function to check TypeScript syntax
check_ts() {
    if npx tsc --noEmit "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 compiles"
        return 0
    else
        echo -e "${RED}✗${NC} $1 has TypeScript errors"
        npx tsc --noEmit "$1"
        return 1
    fi
}

ERROR_COUNT=0

echo "1. Checking New Backend Files..."
echo "--------------------------------"
check_file "convex/incidents.ts" || ((ERROR_COUNT++))
check_ts "convex/incidents.ts" || ((ERROR_COUNT++))
echo ""

echo "2. Checking Schema Changes..."
echo "--------------------------------"
check_file "convex/schema.ts" || ((ERROR_COUNT++))
check_ts "convex/schema.ts" || ((ERROR_COUNT++))
echo ""

echo "3. Checking New Frontend Files..."
echo "--------------------------------"
check_file "src/routes/reports.tsx" || ((ERROR_COUNT++))
check_ts "src/routes/reports.tsx" || ((ERROR_COUNT++))

check_file "src/routes/edit-vehicle.\$vehicleId.tsx" || ((ERROR_COUNT++))
check_ts "src/routes/edit-vehicle.\$vehicleId.tsx" || ((ERROR_COUNT++))
echo ""

echo "4. Checking Modified Files..."
echo "--------------------------------"
check_file "src/routes/session.\$sessionId.tsx" || ((ERROR_COUNT++))
check_ts "src/routes/session.\$sessionId.tsx" || ((ERROR_COUNT++))

check_file "src/routes/my-vehicles.tsx" || ((ERROR_COUNT++))
check_ts "src/routes/my-vehicles.tsx" || ((ERROR_COUNT++))

check_file "src/components/layout/Sidebar.tsx" || ((ERROR_COUNT++))
check_ts "src/components/layout/Sidebar.tsx" || ((ERROR_COUNT++))

check_file "src/lib/types.ts" || ((ERROR_COUNT++))
check_ts "src/lib/types.ts" || ((ERROR_COUNT++))
echo ""

echo "5. Checking Dependencies..."
echo "--------------------------------"
if grep -q '"jspdf"' package.json; then
    echo -e "${GREEN}✓${NC} jsPDF is in package.json"
else
    echo -e "${RED}✗${NC} jsPDF missing from package.json"
    ((ERROR_COUNT++))
fi

if grep -q '"jspdf-autotable"' package.json; then
    echo -e "${GREEN}✓${NC} jspdf-autotable is in package.json"
else
    echo -e "${RED}✗${NC} jspdf-autotable missing from package.json"
    ((ERROR_COUNT++))
fi

if grep -q '"convex"' package.json; then
    echo -e "${GREEN}✓${NC} Convex is in package.json"
else
    echo -e "${RED}✗${NC} Convex missing from package.json"
    ((ERROR_COUNT++))
fi
echo ""

echo "6. Overall TypeScript Check..."
echo "--------------------------------"
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✓${NC} All TypeScript files compile successfully"
else
    echo -e "${YELLOW}⚠${NC} Some TypeScript errors exist (check above)"
    ((ERROR_COUNT++))
fi
echo ""

echo "================================================"
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Ready to deploy. Run:"
    echo "  npx convex dev"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $ERROR_COUNT ERROR(S) FOUND${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi
