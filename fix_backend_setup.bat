@echo off
echo Fixing Backend Setup
echo ====================
echo.

echo 1. NAVIGATING TO BACKEND DIRECTORY...
cd /d "F:\final\tailormatch_backend"

echo 2. ACTIVATING VIRTUAL ENVIRONMENT...
call venv\Scripts\activate.bat

echo 3. CHECKING IF DJANGO IS INSTALLED...
python -c "import django; print('Django version:', django.get_version())" 2>nul
if %errorlevel% neq 0 (
    echo Django not found. Installing dependencies...
    echo.
    echo Installing from requirements.txt...
    pip install -r requirements.txt
    echo.
    echo Dependencies installed!
) else (
    echo Django is already installed.
)

echo.
echo 4. STARTING BACKEND SERVER...
echo =============================
echo Starting Django on 0.0.0.0:8000...
echo.

python manage.py runserver 0.0.0.0:8000

pause
