import re

with open('src/lib/supabase/database.types.ts', 'r') as f:
    content = f.read()

# For every block inside Tables or Views that has Row, Insert, Update
# we insert Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
# wait, actually the simplest is to just use a regex
# find `Update: { ... };` and append `Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];`

# find `Update: { ... };`
# it can span multiple lines or be on a single line.

# Since we don't want to mess up, let's just do:
def replace_func(match):
    update_str = match.group(0)
    return update_str + "\n        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];"

content = re.sub(r'Update:\s*\{[^}]*\};', replace_func, content)

with open('src/lib/supabase/database.types.ts', 'w') as f:
    f.write(content)

print("Done")
