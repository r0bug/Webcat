#!/usr/bin/env python3
import subprocess
import sys

print("WebCat MySQL Setup Helper")
print("========================")
print()

# SQL commands
sql_commands = """
CREATE DATABASE IF NOT EXISTS webcat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'webcat_dev'@'localhost';
CREATE USER 'webcat_dev'@'localhost' IDENTIFIED BY 'webcat123';
GRANT ALL PRIVILEGES ON webcat_db.* TO 'webcat_dev'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database setup complete!' as Status;
"""

# Write SQL to temp file
with open('/tmp/webcat_setup.sql', 'w') as f:
    f.write(sql_commands)

# Try different methods
methods = [
    ("MySQL root without password", ["mysql", "-u", "root"]),
    ("MySQL root with empty password", ["mysql", "-u", "root", "-p"]),
]

for method_name, cmd in methods:
    print(f"\nTrying: {method_name}")
    try:
        # For password prompt, send empty string
        if "-p" in cmd:
            proc = subprocess.Popen(cmd + ["-e", "source /tmp/webcat_setup.sql"], 
                                  stdin=subprocess.PIPE, 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE)
            stdout, stderr = proc.communicate(input=b'\n')
        else:
            proc = subprocess.run(cmd + ["-e", "source /tmp/webcat_setup.sql"], 
                                capture_output=True, text=True)
            stdout = proc.stdout
            stderr = proc.stderr
            
        if proc.returncode == 0:
            print("✓ Success!")
            print("Database and user created successfully.")
            sys.exit(0)
        else:
            print(f"✗ Failed: {stderr if isinstance(stderr, str) else stderr.decode()}")
    except Exception as e:
        print(f"✗ Error: {e}")

print("\nAll automated methods failed.")
print("\nPlease run MySQL manually and execute:")
print(sql_commands)