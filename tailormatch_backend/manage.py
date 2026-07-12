#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # Auto-add local venv site-packages if it exists
    base_dir = os.path.dirname(os.path.abspath(__file__))
    venv_path = os.path.join(base_dir, 'venv')
    if os.path.exists(venv_path):
        import glob
        # Check both Windows and Unix virtualenv layouts
        possible_paths = [
            os.path.join(venv_path, 'Lib', 'site-packages'),
            os.path.join(venv_path, 'lib', 'site-packages'),
        ]
        # Glob for Unix python version-specific subdirectories
        possible_paths.extend(glob.glob(os.path.join(venv_path, 'lib', 'python*', 'site-packages')))
        
        for path in possible_paths:
            if os.path.exists(path):
                import site
                site.addsitedir(path)
                break

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tailormatch_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
