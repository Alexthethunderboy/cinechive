import re

def fix_social_notification_actions():
    path = 'src/lib/social-notification-actions.ts'
    with open(path, 'r') as f:
        content = f.read()
    # Replace actor:profiles(username, avatar_url) with actor:profiles!notifications_actor_id_fkey(username, avatar_url)
    content = content.replace('actor:profiles(', 'actor:profiles!notifications_actor_id_fkey(')
    with open(path, 'w') as f:
        f.write(content)

def fix_feed_actions():
    path = 'src/lib/feed-actions.ts'
    with open(path, 'r') as f:
        content = f.read()
    content = content.replace('.from(activity.activity_type)', '.from(activity.activity_type as any)')
    content = content.replace('.from(activityType)', '.from(activityType as any)')
    with open(path, 'w') as f:
        f.write(content)

def fix_reaction_actions():
    path = 'src/lib/reaction-actions.ts'
    with open(path, 'r') as f:
        content = f.read()
    content = content.replace("supabase.from(table)", "supabase.from(table as any)")
    # Property 'user_id' does not exist on type 'SelectQueryError...'
    # `reactions` uses `profiles(user_id)`?
    # wait, the query in `reaction-actions.ts` around line 23 might be `.select('user_id')` or something.
    # Let's just fix the table string variable first.
    with open(path, 'w') as f:
        f.write(content)

def fix_social_actions():
    path = 'src/lib/social-actions.ts'
    with open(path, 'r') as f:
        content = f.read()
    # It casts to `FollowCounts` which has `followers` and `following`.
    # Let's fix the cast or the type.
    content = content.replace('as unknown as FollowCounts', '')
    content = content.replace('as FollowCounts', '')
    
    # We will map it in the function:
    # return { followers: data[0].followers_count, following: data[0].following_count }
    # but with regex it might be easier to just change `FollowCounts` interface in `social-actions.ts`
    content = re.sub(r'followers:\s*number;', 'followers_count: number;', content)
    content = re.sub(r'following:\s*number;', 'following_count: number;', content)
    
    with open(path, 'w') as f:
        f.write(content)

def fix_save_media_dialog():
    path = 'src/components/vault/SaveMediaDialog.tsx'
    with open(path, 'r') as f:
        content = f.read()
    content = content.replace('res.id', 'res.collectionId')
    with open(path, 'w') as f:
        f.write(content)

fix_social_notification_actions()
fix_feed_actions()
fix_reaction_actions()
fix_social_actions()
fix_save_media_dialog()
print("Fixed small issues")
