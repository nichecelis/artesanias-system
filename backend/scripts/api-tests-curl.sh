#!/bin/bash

# API Test Suite using curl
# Run: bash scripts/api-tests-curl.sh
# 
# Prerequisites:
# 1. Backend must be running on http://localhost:3000
# 2. Database must be seeded with test data

BASE_URL="http://localhost:3001/api/v1"
TOKEN=""
PASSED=0
FAILED=0

echo "========================================"
echo "  ARTESANIAS API TEST SUITE (curl)"
echo "========================================"
echo ""
echo "Base URL: $BASE_URL"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_api() {
    local name="$1"
    local expected_status="$2"
    local actual_status="$3"
    local response="$4"
    
    if [ "$actual_status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $name (Status: $actual_status)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $name (Expected: $expected_status, Got: $actual_status)"
        echo "  Response: ${response:0:200}"
        ((FAILED++))
    fi
}

echo ""
echo "========================================"
echo "  AUTH TESTS"
echo "========================================"

# Login
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"correo":"admin@artesanias.com","password":"Admin123!"}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"correo":"admin@artesanias.com","password":"Admin123!"}')

test_api "Login" 200 "$STATUS" "$RESPONSE"

# Extract token
TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "  Token obtained: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Failed to obtain token${NC}"
    exit 1
fi

# Get current user
RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get current user" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  USUARIOS TESTS"
echo "========================================"

# List usuarios
RESPONSE=$(curl -s -X GET "$BASE_URL/usuarios" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/usuarios" \
    -H "Authorization: Bearer $TOKEN")
test_api "List usuarios" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  CLIENTES TESTS"
echo "========================================"

# List clientes
RESPONSE=$(curl -s -X GET "$BASE_URL/clientes" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/clientes" \
    -H "Authorization: Bearer $TOKEN")
test_api "List clientes" 200 "$STATUS" "$RESPONSE"

# Create cliente
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"Cliente Test $TIMESTAMP\",\"documento\":\"$TIMESTAMP\",\"telefono\":\"3001234567\",\"correo\":\"cliente$TIMESTAMP@test.com\"}")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/clientes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"Cliente Test $TIMESTAMP\",\"documento\":\"$TIMESTAMP\",\"telefono\":\"3001234567\",\"correo\":\"cliente$TIMESTAMP@test.com\"}")
test_api "Create cliente" 201 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  PRODUCTOS TESTS"
echo "========================================"

# List productos
RESPONSE=$(curl -s -X GET "$BASE_URL/productos" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/productos" \
    -H "Authorization: Bearer $TOKEN")
test_api "List productos" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  EMPLEADOS TESTS"
echo "========================================"

# List empleados
RESPONSE=$(curl -s -X GET "$BASE_URL/empleados" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/empleados" \
    -H "Authorization: Bearer $TOKEN")
test_api "List empleados" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  GRUPOS TESTS"
echo "========================================"

# List grupos
RESPONSE=$(curl -s -X GET "$BASE_URL/grupos" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/grupos" \
    -H "Authorization: Bearer $TOKEN")
test_api "List grupos" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  DECORADORAS TESTS"
echo "========================================"

# List decoradoras
RESPONSE=$(curl -s -X GET "$BASE_URL/decoradoras" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/decoradoras" \
    -H "Authorization: Bearer $TOKEN")
test_api "List decoradoras" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  PEDIDOS TESTS"
echo "========================================"

# List pedidos
RESPONSE=$(curl -s -X GET "$BASE_URL/pedidos" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/pedidos" \
    -H "Authorization: Bearer $TOKEN")
test_api "List pedidos" 200 "$STATUS" "$RESPONSE"

# Get stats
RESPONSE=$(curl -s -X GET "$BASE_URL/pedidos/stats/resumen" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/pedidos/stats/resumen" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get pedidos stats" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  NOMINA TESTS"
echo "========================================"

# List nomina
RESPONSE=$(curl -s -X GET "$BASE_URL/nomina" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/nomina" \
    -H "Authorization: Bearer $TOKEN")
test_api "List nomina" 200 "$STATUS" "$RESPONSE"

# Get total mes
RESPONSE=$(curl -s -X GET "$BASE_URL/nomina/total-mes?mes=2025-03" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/nomina/total-mes?mes=2025-03" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get nomina total mes" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  PRESTAMOS TESTS"
echo "========================================"

# List prestamos
RESPONSE=$(curl -s -X GET "$BASE_URL/prestamos" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/prestamos" \
    -H "Authorization: Bearer $TOKEN")
test_api "List prestamos" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  FACTURAS TESTS"
echo "========================================"

# List facturas
RESPONSE=$(curl -s -X GET "$BASE_URL/facturas" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/facturas" \
    -H "Authorization: Bearer $TOKEN")
test_api "List facturas" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  REPORTES TESTS"
echo "========================================"

# Ventas por cliente
RESPONSE=$(curl -s -X GET "$BASE_URL/reportes/ventas-por-cliente?desde=2025-01-01&hasta=2025-12-31" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/reportes/ventas-por-cliente?desde=2025-01-01&hasta=2025-12-31" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get ventas por cliente" 200 "$STATUS" "$RESPONSE"

# Pedidos activos
RESPONSE=$(curl -s -X GET "$BASE_URL/reportes/pedidos-activos" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/reportes/pedidos-activos" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get pedidos activos" 200 "$STATUS" "$RESPONSE"

# Pagos decoradoras
RESPONSE=$(curl -s -X GET "$BASE_URL/reportes/pagos-decoradoras" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/reportes/pagos-decoradoras" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get pagos decoradoras" 200 "$STATUS" "$RESPONSE"

# Nomina mes
RESPONSE=$(curl -s -X GET "$BASE_URL/reportes/nomina-mes?mes=2025-03" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/reportes/nomina-mes?mes=2025-03" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get nomina del mes" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  PARAMETRIZACION TESTS"
echo "========================================"

# Get parametrizacion
RESPONSE=$(curl -s -X GET "$BASE_URL/parametrizacion" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/parametrizacion" \
    -H "Authorization: Bearer $TOKEN")
test_api "Get parametrizacion" 200 "$STATUS" "$RESPONSE"

# Update parametrizacion
RESPONSE=$(curl -s -X PATCH "$BASE_URL/parametrizacion" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"telefono":"3001234567"}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/parametrizacion" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"telefono":"3001234567"}')
test_api "Update parametrizacion" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  DESPACHOS TESTS"
echo "========================================"

# List despachos
RESPONSE=$(curl -s -X GET "$BASE_URL/despachos" \
    -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/despachos" \
    -H "Authorization: Bearer $TOKEN")
test_api "List despachos" 200 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  ERROR HANDLING TESTS"
echo "========================================"

# Invalid login
RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"correo":"invalid@test.com","password":"wrongpassword"}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"correo":"invalid@test.com","password":"wrongpassword"}')
test_api "Invalid login" 401 "$STATUS" "$RESPONSE"

# Unauthorized access
RESPONSE=$(curl -s -X GET "$BASE_URL/usuarios" \
    -H "Authorization: Bearer invalid-token")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/usuarios" \
    -H "Authorization: Bearer invalid-token")
test_api "Unauthorized access" 401 "$STATUS" "$RESPONSE"

echo ""
echo "========================================"
echo "  TEST SUMMARY"
echo "========================================"
echo ""
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
