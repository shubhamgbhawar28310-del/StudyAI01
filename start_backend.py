import sys
import os

# Add the site-packages directory to the path
site_packages_path = 'C:/Users/KISHAN PRAJAPATI/AppData/Local/Programs/Python/Python313/Lib/site-packages'
if site_packages_path not in sys.path:
    sys.path.insert(0, site_packages_path)

# Add the python-backend directory to the path
backend_path = os.path.join(os.path.dirname(__file__), 'python-backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Add the src directory to the path
src_path = os.path.join(backend_path, 'src')
if src_path not in sys.path:
    sys.path.insert(0, src_path)

print("Python path:", sys.path)

try:
    import flask
    print("Flask imported successfully")
    
    # Now import the app
    from app import app
    print("App imported successfully")
    
    if __name__ == '__main__':
        print("Starting backend server on http://localhost:5000")
        app.run(host='0.0.0.0', port=5000, debug=True)
        
except ImportError as e:
    print("Import error:", e)
    import traceback
    traceback.print_exc()