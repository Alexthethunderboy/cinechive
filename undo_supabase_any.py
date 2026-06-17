import os
import re

files_to_fix = [
    'src/lib/media-actions.ts',
    'src/lib/reaction-actions.ts',
    'src/lib/services/DeepDataService.ts',
    'src/lib/social-actions.ts',
    'src/lib/social-dispatch-actions.ts',
    'src/lib/social-notification-actions.ts',
    'src/lib/collection-actions.ts',
    'src/lib/community-actions.ts',
    'src/lib/search-actions.ts'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace `(supabase as any).from(` with `supabase.from(`
    content = content.replace('(supabase as any).from(', 'supabase.from(')
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Reverted to supabase.from")
