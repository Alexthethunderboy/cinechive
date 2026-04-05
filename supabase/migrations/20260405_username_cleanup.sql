-- Stripping legacy 'u.' prefix from existing usernames and display names in the profiles table.
-- This ensures that legacy artifacts from the authentication system are cleaned up.

-- 1. Clean the username column
UPDATE profiles
SET username = SUBSTRING(username FROM 3)
WHERE username LIKE 'u.%';

-- 2. Clean the display_name column
-- Some display_names might have inherited the prefix if they were auto-populated
UPDATE profiles
SET display_name = SUBSTRING(display_name FROM 3)
WHERE display_name LIKE 'u.%';
