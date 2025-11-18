#!/usr/bin/env python3
"""
Fix Next.js 16 dynamic route params to be Promise types.
This script updates all dynamic route handlers to use Promise<{param: type}> instead of {param: type}.
"""

import os
import re
import subprocess

def find_dynamic_routes():
    """Find all route.ts files in dynamic route directories."""
    result = subprocess.run(
        ['find', 'app/api', '-type', 'f', '-name', 'route.ts', '-path', '*/[*]/*'],
        capture_output=True,
        text=True,
        cwd='/Users/admin/Desktop/ontarget-erp-v5'
    )
    return [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]

def extract_param_name(path):
    """Extract parameter name from path like app/api/users/[userId]/route.ts -> userId"""
    match = re.search(r'\[([^\]]+)\]', path)
    return match.group(1) if match else None

def fix_route_file(filepath):
    """Fix a single route file to use Promise params."""
    base_path = '/Users/admin/Desktop/ontarget-erp-v5'
    full_path = os.path.join(base_path, filepath)
    
    param_name = extract_param_name(filepath)
    if not param_name:
        print(f"  ⚠️  Could not extract param name from {filepath}")
        return False
    
    try:
        with open(full_path, 'r') as f:
            content = f.read()
        
        original_content = content
        changes_made = False
        
        # Pattern 1: Function signatures like:
        # export async function GET(request: NextRequest, { params }: { params: { userId: string } })
        pattern1 = rf'(\bexport\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\{{\s*params\s*\}}\s*:\s*\{{\s*params\s*:\s*)\{{\s*{param_name}\s*:\s*([^}}]+)\}}'
        replacement1 = rf'\1Promise<{{ {param_name}: \2 }}>'
        
        new_content = re.sub(pattern1, replacement1, content)
        if new_content != content:
            content = new_content
            changes_made = True
            print(f"  ✓ Fixed function signature")
        
        # Pattern 2: Usage like params.userId -> await params then use userId
        # Find all function bodies and fix params usage
        functions = re.finditer(
            rf'export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\([^)]+\{{\s*params\s*\}}\s*:\s*\{{\s*params\s*:\s*Promise<\{{\s*{param_name}\s*:\s*[^}}]+\}}>',
            content
        )
        
        for match in functions:
            method = match.group(1)
            # Find the function body
            start = match.end()
            brace_count = 0
            in_function = False
            func_start = start
            func_end = start
            
            for i in range(start, len(content)):
                if content[i] == '{':
                    if not in_function:
                        in_function = True
                        func_start = i
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                    if brace_count == 0 and in_function:
                        func_end = i + 1
                        break
            
            if func_start < func_end:
                func_body = content[func_start:func_end]
                
                # Check if we already have the await params pattern
                if f'const {{ {param_name} }} = await params;' in func_body:
                    continue
                
                # Check if params.paramName is used
                if f'params.{param_name}' in func_body:
                    # Add await params destructuring after the opening brace and try statement
                    # Find the position after "try {" if exists, otherwise after the function "{"
                    insert_pos = func_body.find('try {')
                    if insert_pos != -1:
                        insert_pos = func_body.find('{', insert_pos) + 1
                    else:
                        insert_pos = 1  # After the opening brace
                    
                    # Find indentation of next line
                    next_line_start = func_body.find('\n', insert_pos) + 1
                    indent = ''
                    if next_line_start < len(func_body):
                        for char in func_body[next_line_start:]:
                            if char in (' ', '\t'):
                                indent += char
                            else:
                                break
                    
                    # Insert the destructuring
                    new_line = f'\n{indent}const {{ {param_name} }} = await params;\n'
                    new_func_body = func_body[:insert_pos] + new_line + func_body[insert_pos:]
                    
                    # Replace params.paramName with paramName
                    new_func_body = new_func_body.replace(f'params.{param_name}', param_name)
                    
                    content = content[:func_start] + new_func_body + content[func_end:]
                    changes_made = True
                    print(f"  ✓ Fixed {method} method body")
        
        if changes_made:
            with open(full_path, 'w') as f:
                f.write(content)
            return True
        else:
            print(f"  → No changes needed")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("🔍 Finding dynamic route files...")
    routes = find_dynamic_routes()
    print(f"Found {len(routes)} dynamic route files\n")
    
    fixed = 0
    skipped = 0
    errors = 0
    
    for route in routes:
        print(f"\n📝 Processing {route}")
        param_name = extract_param_name(route)
        if param_name:
            print(f"   Parameter: {param_name}")
            if fix_route_file(route):
                fixed += 1
            else:
                skipped += 1
        else:
            errors += 1
    
    print(f"\n✨ Summary:")
    print(f"   Fixed: {fixed}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}")

if __name__ == '__main__':
    main()
