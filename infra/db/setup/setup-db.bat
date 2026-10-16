@echo off
REM ============================================================
REM Six Yards Love eCommerce - PostgreSQL Setup Script (Windows)
REM Run this as the FIRST step on a fresh system
REM
REM Prerequisites:
REM   1. PostgreSQL installed (download from https://www.postgresql.org/download/windows/)
REM   2. psql or pgAdmin available
REM   3. PostgreSQL running on default port 5432
REM ============================================================

set PGPASSWORD=postgres
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=ecom_dev
set DB_USER=postgres

echo [1/6] Creating database...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %errorlevel% neq 0 echo   Database already exists, skipping creation.

echo.
echo [2/6] Running schema.sql (base tables)...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f schema.sql
if %errorlevel% neq 0 (
    echo   FAILED at schema.sql - aborting.
    exit /b 1
)

echo.
echo [3/6] Running schema-coupons.sql...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f schema-coupons.sql

echo.
echo [4/6] Running schema-coupons-migration.sql...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f schema-coupons-migration.sql

echo.
echo [5/6] Running schema-international.sql...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f schema-international.sql

echo.
echo [6/6] Running schema-india-localization.sql...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f schema-india-localization.sql

echo.
echo ===============================================
echo Setup complete! Next steps:
echo   1. Run remaining migration scripts in order:
echo      schema-media.sql
echo      schema-shiprocket.sql
echo      schema-payments.sql
echo      schema-return-request.sql
echo      schema-courier-selection.sql
echo      schema-shipping-fee.sql
echo      schema-packaging-boxes.sql
echo   2. Configure your .env file (copy from .env.example)
echo   3. Start the backend: cd backend ^&^& mvn spring-boot:run
echo ===============================================
pause