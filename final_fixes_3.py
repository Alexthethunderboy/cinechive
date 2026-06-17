import re
import os

def fix_imports():
    files = [
        'src/app/error.tsx',
        'src/app/not-found.tsx',
        'src/app/media/[type]/[id]/error.tsx'
    ]
    for path in files:
        if os.path.exists(path):
            with open(path, 'r') as f:
                content = f.read()
            content = content.replace("import { GlassPanel } from '@/components/ui/GlassPanel';", "import GlassPanel from '@/components/ui/GlassPanel';")
            content = content.replace("import { Button } from '@/components/ui/Button';", "import { Button } from '@/components/ui/button';")
            with open(path, 'w') as f:
                f.write(content)

def fix_database_collections():
    path = 'src/lib/supabase/database.types.ts'
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        content = content.replace("is_public: boolean;\n          created_at: string;", "is_public: boolean;\n          share_token: string | null;\n          created_at: string;")
        content = content.replace("is_public?: boolean;\n          created_at?: string;", "is_public?: boolean;\n          share_token?: string | null;\n          created_at?: string;")
        with open(path, 'w') as f:
            f.write(content)

def fix_social_actions():
    path = 'src/lib/social-actions.ts'
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        content = content.replace("followers: data[0]?.followers_count || 0 - (isFollowing ? 1 : 0),", "followers: ((data[0] as any)?.followers_count || 0) - (isFollowing ? 1 : 0),")
        content = content.replace("followers: data[0]?.followers_count || 0 + (!isFollowing ? 1 : 0),", "followers: ((data[0] as any)?.followers_count || 0) + (!isFollowing ? 1 : 0),")
        content = content.replace("followers_count: number;\n  following_count: number;", "followers: number;\n  following: number;")
        with open(path, 'w') as f:
            f.write(content)

def fix_social_reviews():
    path = 'src/lib/social-reviews-actions.ts'
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        content = content.replace(".eq('media_type', mediaType)", ".eq('media_type', mediaType as any)")
        with open(path, 'w') as f:
            f.write(content)

def fix_vault_page():
    path = 'src/app/vault/collections/[id]/page.tsx'
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        content = content.replace("collection.collection_items.map(", "(collection.collection_items as any[]).map(")
        with open(path, 'w') as f:
            f.write(content)

def fix_save_media():
    path = 'src/components/vault/SaveMediaDialog.tsx'
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        content = content.replace("if (status.isVault) {", "if ((status as any).isVault) {")
        content = content.replace("setVaultStatus(status.isVault);", "setVaultStatus((status as any).isVault);")
        with open(path, 'w') as f:
            f.write(content)

fix_imports()
fix_database_collections()
fix_social_actions()
fix_social_reviews()
fix_vault_page()
fix_save_media()

print("Fixed third batch of small issues")
