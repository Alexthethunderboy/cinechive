import os
import re

ACTIONS_FILE = '/Users/thunderboy/Docs/syntaxWorkspacee/enterarchive/src/lib/actions.ts'

with open(ACTIONS_FILE, 'r') as f:
    content = f.read()

# Define the imports needed for each file type
IMPORTS = {
    'media_actions': """'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ClassificationName } from './design-tokens';
import { toCanonicalMediaId } from './media-identity';
""",
    'search_actions': """'use server';

import { searchMedia, enrichWithDirector } from './api/tmdb';
import { mapTMDBToUnified, UnifiedMedia } from './api/mapping';
import { SearchService } from './services/SearchService';
import { MediaFetcher } from './api/MediaFetcher';
""",
    'collection_actions': """'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
""",
    'social_actions': """'use server';

import { createClient } from '@/lib/supabase/server';
""",
    'profile_actions': """'use server';

import { createClient } from '@/lib/supabase/server';
""",
    'dashboard_actions': """'use server';

import { getMovieDetails } from './api/tmdb';
import { DeepDataService } from './services/DeepDataService';
import { getVaultEntries } from './media-actions';
"""
}

def extract_function(func_name, content):
    # Matches `export async function func_name(...) { ... }` handles nested braces
    pattern = r'(/\*\*.*?\*/\s*)?export\s+async\s+function\s+' + func_name + r'\s*\([\s\S]*?\)\s*(?::\s*[^{]+)?\{'
    match = re.search(pattern, content)
    if not match:
        return ""
    start_idx = match.start()
    brace_start = content.find('{', start_idx)
    brace_count = 1
    idx = brace_start + 1
    while brace_count > 0 and idx < len(content):
        if content[idx] == '{':
            brace_count += 1
        elif content[idx] == '}':
            brace_count -= 1
        idx += 1
    return content[start_idx:idx]

# Grouping
MEDIA_FUNCS = ['archiveMediaAction', 'removeMediaEntryAction', 'toggleArchiveMediaAction', 'getIsInVaultAction', 'getSavedVaultMediaKeysAction', 'getVaultEntries']
SEARCH_FUNCS = ['unifiedSearchAction', 'getSeasonEpisodesAction', 'globalSearchAction', 'getDeepEntityAction', 'getPersonCatalogAction', 'getCuratedCollectionsAction', 'getStylePageAction', 'getGenrePageAction', 'getSelectionPageAction']
COLLECTION_FUNCS = ['createCollectionAction', 'deleteCollectionAction', 'addMediaToCollectionAction', 'removeMediaFromCollectionAction', 'getUserCollectionsAction', 'getCollectionDetailsAction', 'getSharedCollectionAction']
SOCIAL_FUNCS = ['getPublicReviews', 'getFriendReviews']
PROFILE_FUNCS = ['getCurrentUser', 'getProfile', 'getMediaEntryForUser']
DASHBOARD_FUNCS = ['getRandomTriviaAction']

# We will also append getCommunityFeed, reArchiveMediaAction, echoTriviaAction to their respective files using normal appends
FEED_FUNCS = ['getCommunityFeed']
COMMUNITY_FUNCS = ['reArchiveMediaAction', 'echoTriviaAction']

def write_group(filename, import_key, func_names):
    code = IMPORTS[import_key] + "\n"
    for fn in func_names:
        func_code = extract_function(fn, content)
        if func_code:
            code += func_code + "\n\n"
    with open(f'/Users/thunderboy/Docs/syntaxWorkspacee/enterarchive/src/lib/{filename}', 'w') as f:
        f.write(code)

write_group('media-actions.ts', 'media_actions', MEDIA_FUNCS)
write_group('search-actions.ts', 'search_actions', SEARCH_FUNCS)
write_group('collection-actions.ts', 'collection_actions', COLLECTION_FUNCS)
write_group('social-reviews-actions.ts', 'social_actions', SOCIAL_FUNCS)
write_group('profile-data-actions.ts', 'profile_actions', PROFILE_FUNCS)
write_group('dashboard-actions.ts', 'dashboard_actions', DASHBOARD_FUNCS)

# Append to feed-actions.ts
feed_code = ""
for fn in FEED_FUNCS:
    c = extract_function(fn, content)
    if c: feed_code += "\n" + c + "\n"
if feed_code:
    with open('/Users/thunderboy/Docs/syntaxWorkspacee/enterarchive/src/lib/feed-actions.ts', 'a') as f:
        # Add createClient import if not exists
        with open('/Users/thunderboy/Docs/syntaxWorkspacee/enterarchive/src/lib/feed-actions.ts', 'r') as fr:
            existing = fr.read()
            if "createClient" not in existing:
                feed_code = "import { createClient } from '@/lib/supabase/server';\n" + feed_code
        f.write(feed_code)

# Append to community-actions.ts
comm_code = ""
for fn in COMMUNITY_FUNCS:
    c = extract_function(fn, content)
    if c: comm_code += "\n" + c + "\n"
if comm_code:
    with open('/Users/thunderboy/Docs/syntaxWorkspacee/enterarchive/src/lib/community-actions.ts', 'a') as f:
        with open('/Users/thunderboy/Docs/syntaxWorkspacee/enterarchive/src/lib/community-actions.ts', 'r') as fr:
            existing = fr.read()
            if "revalidatePath" not in existing:
                comm_code = "import { revalidatePath } from 'next/cache';\n" + comm_code
            if "ClassificationName" not in existing:
                comm_code = "import { ClassificationName } from './design-tokens';\n" + comm_code
        f.write(comm_code)

# Write the new barrel file for actions.ts
BARREL_CODE = """'use server';

export * from './media-actions';
export * from './search-actions';
export * from './collection-actions';
export * from './social-reviews-actions';
export * from './profile-data-actions';
export * from './dashboard-actions';
export * from './feed-actions';
export * from './community-actions';
"""

with open(ACTIONS_FILE, 'w') as f:
    f.write(BARREL_CODE)

print("Refactoring complete.")
