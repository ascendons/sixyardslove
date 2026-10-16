# =============================================
# Six Yards Love eCommerce - Database Setup (PowerShell)
# Run on a NEW Windows system with PostgreSQL
# =============================================

$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "ecom_dev"
$DB_USER = "postgres"

# Get password securely
$pass = Read-Host -assecurestring "Enter PostgreSQL password for $DB_USER:"
$PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass))

$ErrorActionPreference = "Stop"

Write-Host "[1/12] Creating database..." -ForegroundColor Cyan
$cmd = "psql" ; $args = "-h $DB_HOST -p $DB_PORT -U $DB_USER -c ""CREATE DATABASE $DB_NAME;"""
& cmd $args.Split(' ') 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Database may already exist, continuing..." -ForegroundColor Yellow }

$scripts = @(
    @{n="001_schema.sql";                    d="Base tables (users, products, orders, etc.)"},
    @{n="002_schema-coupons.sql";            d="Coupons"},
    @{n="003_schema-coupons-migration.sql"; d="Coupon rules fix"},
    @{n="004_schema-international.sql";      d="Currencies, tax rates, country mapping"},
    @{n="005_schema-india-localization.sql"; d="GST & Indian states"},
    @{n="006_schema-media.sql";              d="Media assets (banners, carousels)"},
    @{n="007_schema-shiprocket.sql";         d="Shiprocket shipment IDs"},
    @{n="008_schema-payments.sql";           d="Payment enhancements"},
    @{n="009_schema-return-request.sql";     d="Return request fields"},
    @{n="010_schema-courier-selection.sql"; d="Preferred courier on orders"},
    @{n="011_schema-shipping-fee.sql";       d="Shipping fee column"},
    @{n="012_schema-packaging-boxes.sql";    d="Packaging boxes for shipping"}
)

$idx = 2
foreach ($s in $scripts) {
    Write-Host "[$idx/12] Running $($s.n) - $($s.d)..." -ForegroundColor Cyan
    $filePath = Join-Path $PSScriptRoot $s.n
    if (-not (Test-Path $filePath)) {
        Write-Host "  WARNING: $filePath not found - skipping" -ForegroundColor Yellow
    } else {
        & cmd "-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $filePath".Split(' ')
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR running $($s.n)" -ForegroundColor Red
            break
        }
    }
    $idx++
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  1. Copy backend/.env.example to backend/.env and fill in secrets"
Write-Host "  2. Run: cd backend; mvn spring-boot:run"
Write-Host "=============================================" -ForegroundColor Green