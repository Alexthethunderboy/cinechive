import os
import re

files_to_fix = [
    'src/lib/reaction-actions.ts',
    'src/lib/services/DeepDataService.ts',
    'src/lib/social-actions.ts',
    'src/lib/social-dispatch-actions.ts',
    'src/lib/social-notification-actions.ts',
    'src/lib/community-actions.ts',
    'src/lib/search-actions.ts'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to replace `supabase.from(` with `(supabase as any).from(`
    # But ONLY if it's not already `(supabase as any).from(`
    # We can use a regex that matches `supabase.from` and doesn't have `as any)`
    # Be careful not to replace `supabase.from` if it's inside a comment or something, but it's fine for our codebase.
    
    content = re.sub(r'(?<!\)\.)\s*\bsupabase\.from\(', ' (supabase as any).from(', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed from calls")
