# CineChive: The Vibe & The Tech

Welcome to **CineChive**! If you're a film lover who cares about the details—the lighting, the sound, the mood—you're in the right place. We built this for curators, not just "watchers."

Here's a comprehensive breakdown of what the app does, how to use it, and a complete technical overview.

---

## 🎬 What is CineChive?
CineChive is a high-end digital sanctuary for your movie collection. Instead of just a boring list, we focus on the **vibe**. We categorize films by their "cinematic style" (like *Atmospheric*, *Noir*, or *Visceral*) so you can find exactly what you're in the mood for.

### 🌟 Core Experience (The Fun Stuff)

#### 1. Discovery & The "Everything" Bar
*   **The Home Feed**: Fresh, trending movies and shows presented in a beautiful, immersive layout.
*   **Discover by Mood**: Tired of just "Action" or "Drama"? You can browse by **Cinematic Vibes**. Want something moody? Hit *Melancholic*. Want something raw? Hit *Visceral*.
*   **Global Search**: One search bar for everything—movies, TV shows, actors, and directors.
*   **Style-Based Discovery**: Browse by cinematic styles (Essential, Avant-Garde, Melancholic, etc.)
*   **Genre-Based Discovery**: Traditional genre browsing (Action, Drama, Comedy, etc.)
*   **Curated Selections**: Hand-picked collections like "Noir Shadows", "Neon Dreams", "Hidden Gems"

#### 2. Your Private Library (The Vault)
*   **Saving**: Save anything to your personal "Vault." You can track what you've watched, what you're currently watching, or what you're planning to see.
*   **Collections**: Think of these as custom playlists for movies. You can group films however you want (e.g., "Neon Dreams," "Depressing Sundays," or "Essential Scifi").
*   **Library Organization**: Grid and list views for your saved media
*   **Mood-Based Filtering**: Filter your vault by cinematic classifications
*   **Vault Statistics**: Track your collection size and curation patterns

#### 3. Deep Dive into Media
When you click a movie, we don't just show you a poster. We give you:
*   **Technical Specs**: For the nerds—we show what camera was used (Arri, Panavision), the film format (35mm, IMAX), and the sound mix (Dolby Atmos, DTS).
*   **Trivia & Deep Dives**: Cool facts and production history you won't find on a standard landing page.
*   **Related Traversal**: Click a director or a composer, and you're instantly exploring their entire body of work.
*   **Soundtrack Integration**: Spotify links to composer soundtracks
*   **Cast & Crew Details**: Comprehensive actor, director, and crew information
*   **Episode Guides**: For TV shows, detailed season and episode information
*   **Community Ratings**: Aggregate star ratings from users (1-10 scale)
*   **Friend Activity**: See what your friends have done with this media
*   **Media Posts**: Community discussions and posts about specific media

#### 4. The Society (The Community)
*   **Dispatches**: These are like mini-blog posts. You can share thorough thoughts on a film with your followers.
*   **TikTok-style Reposts**: Found a cool post? "Collect" it, and it show up on your feed as a repost, giving credit to the original creator.
*   **Following**: Build a network of other cinephiles whose taste you trust.
*   **Activity Feed**: Chronological feed of community activity
*   **Social Reactions**: Like/unlike activities, posts, and media entries
*   **Comments**: Threaded conversations on posts and activities
*   **Mentions**: @username mentions in posts and comments
*   **Notifications**: Real-time notifications for follows, reactions, comments, mentions
*   **Community Search**: Find users and posts in the community

#### 5. CineJournal & Ratings
*   **Track your Screenings**: Log exactly when you watched a film and what you thought of it.
*   **Ratings**: Grade films on a elegant 1-10 star scale. Your history is saved in a beautiful, chronological journal.
*   **Rewatch Tracking**: Mark screenings as rewatches
*   **Review Text**: Write detailed reviews for your screenings
*   **Journal Statistics**: Track your viewing habits and patterns
*   **Screening History**: Complete chronological log of all your viewings

#### 6. Profile & Cinematic Styles
*   **Your Style**: Your profile avatar isn't just a picture—it has "Styles" (like glowing borders or cinematic effects) based on your personality.
*   **Stats**: See how many minutes you've spent in the cinema, how many curators follow you, and more.
*   **Avatar Customization**: Multiple avatar modes (image, character, animated)
*   **Profile Spotlight**: Feature a favorite media item on your profile
*   **Taste Matching**: Compatibility scores with other users based on preferences
*   **Onboarding Flow**: Personalized setup based on cinematic tastes
*   **Profile Completion**: Progress tracking for profile setup
*   **Social Connections**: Followers/following management

#### 7. Social Intelligence Features
*   **Preference System**: Like/dislike media with heart/thumbs-down buttons
*   **Activity Reactions**: Like posts, dispatches, and community activities
*   **Friend Recommendations**: See what friends are watching/saving
*   **Taste Compatibility**: Match scores with other users
*   **Social Graph**: Follow/unfollow system with follower counts
*   **Activity Notifications**: Real-time updates on social interactions

#### 8. Advanced Features
*   **Watch Links**: External streaming service links
*   **Release Radar**: Upcoming movie tracking with reminders
*   **Random Trivia**: Daily cinematic facts and trivia
*   **Deep Entity Details**: Comprehensive movie/TV show information
*   **Person Catalogs**: Complete filmographies for actors/directors
*   **Advanced Search**: Multi-criteria search with mood filtering
*   **Hidden Gems Filter**: Discover underrated films
*   **Animation Support**: Full anime and animation content support

---

## 🛠️ Under the Hood (The Complete Tech Stack)

### The Architecture
*   **Framework**: Based on **Next.js 16 (App Router)** and **React 19**. It's incredibly fast and uses **Server Actions** for secure, server-side data handling.
*   **State Management**: We use **Tanstack React Query** to handle super-fast loading and caching, so once you see a poster, it's there to stay.
*   **Backend**: Powered by **Supabase**. It handles everything from our database and secure logins to real-time notifications.
*   **The Look**: Styled with **Tailwind CSS v4** (the latest and greatest) and **Vanilla CSS** for that pixel-perfect editorial control.
*   **Motion**: All those smooth transitions and pop-ups? That's **Framer Motion v12** handling physics-based animations.
*   **TypeScript**: Full type safety throughout the application
*   **Real-time**: Supabase real-time subscriptions for live updates

### Database Schema (Complete)
**Core Tables:**
- `profiles`: User profiles with avatars, bios, social stats
- `media_entries`: User's saved media with classifications and ratings
- `media_ratings`: Community star ratings (1-10 scale)
- `media_reactions`: Like/dislike preferences for media
- `re_archives`: Social re-sharing of media entries
- `echoes`: Trivia sharing feature
- `dispatches`: Community posts/status updates
- `comments`: Threaded comments on activities
- `reactions`: Likes on activities, posts, dispatches
- `follows`: Social following system
- `collections`: User-created media collections
- `cine_journal`: Detailed screening logs with ratings and reviews
- `notifications`: Real-time social notifications
- `mood_tags`: Cinematic classification system
- `activity_reposts`: Repost functionality

### Server Actions (Complete List)

**Authentication & Profile:**
- `signUp()`: User registration with username validation
- `login()`: User authentication
- `signOut()`: User logout
- `updateProfile()`: Profile information updates
- `deleteAccount()`: Account deletion with data cleanup
- `clearHistory()`: Clear user's media history
- `getCurrentUser()`: Get authenticated user data
- `getProfile()`: Get user profile by username
- `getProfileByUsername()`: Profile data with social stats

**Media Management:**
- `archiveMediaAction()`: Save media to vault with classification
- `removeMediaEntryAction()`: Remove from vault
- `getMediaEntryForUser()`: Get user's saved media entry
- `setMediaPreferenceAction()`: Like/dislike media
- `getMediaPreferenceAction()`: Get user's preference for media
- `getMediaSocialStatsAction()`: Get likes/dislikes counts
- `getMediaCommunityRatingAction()`: Get average star ratings

**Social Features:**
- `followUserAction()`: Follow another user
- `unfollowUserAction()`: Unfollow user
- `getFollowStatusAction()`: Check follow relationship
- `getFollowCountsAction()`: Get follower/following counts
- `getFollowersAction()`: Get user's followers
- `getFollowingAction()`: Get users being followed

**Community & Activity:**
- `createDispatchAction()`: Create community post
- `updateDispatchAction()`: Edit dispatch (15min window)
- `deleteDispatchAction()`: Delete dispatch
- `toggleReactionAction()`: Like/unlike activities
- `getActivityReactionCount()`: Get reaction counts
- `postCommentAction()`: Add comment to activity
- `deleteCommentAction()`: Remove comment
- `getCommentsAction()`: Get activity comments

**Journal & Reviews:**
- `logScreeningAction()`: Log movie screening with details
- `getJournalEntriesAction()`: Get user's journal entries
- `getPublicReviews()`: Get community reviews for media
- `getFriendReviews()`: Get friends' reviews

**Collections:**
- `createCollectionAction()`: Create new collection
- `deleteCollectionAction()`: Delete collection
- `addMediaToCollectionAction()`: Add media to collection
- `removeMediaFromCollectionAction()`: Remove from collection
- `getUserCollectionsAction()`: Get user's collections
- `getCollectionDetailsAction()`: Get collection contents
- `getSharedCollectionAction()`: Access shared collection
- `getCuratedCollectionsAction()`: Get featured collections

**Discovery & Search:**
- `unifiedSearchAction()`: Global media search
- `globalSearchAction()`: Advanced search with filters
- `getTrendingFeedAction()`: Trending content feed
- `getAnimeFeedAction()`: Anime-specific trending
- `getStylePageAction()`: Browse by cinematic style
- `getGenrePageAction()`: Browse by genre
- `getSelectionPageAction()`: Curated selection pages
- `getDeepEntityAction()`: Detailed movie/TV info
- `getPersonCatalogAction()`: Actor/director filmography
- `getSeasonEpisodesAction()`: TV episode details

**Notifications:**
- `getSocialNotificationsAction()`: Get user notifications
- `markNotificationAsReadAction()`: Mark notification read
- `createNotificationInternal()`: Internal notification creation

**Onboarding & Intelligence:**
- `getOnboardingTastes()`: Get user's taste preferences
- `saveOnboardingTastes()`: Save onboarding selections
- `getProfilePageData()`: Complete profile data
- `calculateTasteMatchAction()`: Compatibility scoring

**Utility Actions:**
- `getRandomTriviaAction()`: Random cinematic facts
- `reArchiveMediaAction()`: Social re-sharing
- `echoTriviaAction()`: Share trivia facts
- `getFriendActivityAction()`: Friends' media activity
- `getPostsByMediaAction()`: Media-related posts

### UI Components (Complete)

**Layout & Navigation:**
- `Navigation`: Main app navigation with sidebar/bottom nav
- `BottomNav`: Mobile navigation with customizable items
- `CinematicAvatar`: Animated profile avatars with styles
- `GlassPanel`: Glassmorphism UI containers

**Discovery & Media:**
- `DiscoveryCard`: Media cards with preference buttons
- `MediaHero`: Media detail hero section
- `MediaInfo`: Technical specifications display
- `MediaPreferenceButtons`: Like/dislike buttons
- `CommunityRating`: Star rating display
- `FriendActivity`: Social activity indicators
- `MusicSection`: Soundtrack integration
- `DeepDiveSection`: Trivia and technical details
- `CastCrewSection`: Actor/director information
- `ReviewSection`: User reviews and ratings
- `TechnicalLab`: Camera/sound format details
- `TriviaModule`: Interactive trivia display

**Social & Community:**
- `ReactionButton`: Activity like/unlike buttons
- `FollowButton`: Follow/unfollow user buttons
- `CommunityComposer`: Post creation interface
- `CommunityNotificationCenter`: Notification management
- `CineJournal`: Screening journal interface
- `CineLists`: Collection management
- `ActivityHub`: Activity feed display
- `DispatchCard`: Community post display

**Profile & Dashboard:**
- `ProfileDashboard`: Complete profile interface
- `ProfileSpotlight`: Featured media display
- `ProfileEmptyState`: Empty state components
- `VaultDisplay`: Library grid/list views
- `ProfileSettingsUI`: Settings management

**Search & Discovery:**
- `EverythingBar`: Global search interface
- `OracleResults`: Search results display
- `PersonResultCard`: Person search results
- `TrendingFeed`: Trending content display
- `GenreFeed`: Genre-based browsing
- `StyleFeed`: Style-based browsing
- `ReleaseRadar`: Upcoming releases
- `ReleaseRadarCard`: Release tracking cards

**Utility & Forms:**
- `AuthForm`: Login/signup forms
- `SaveMediaDialog`: Media saving interface
- `LogJournalDialog`: Screening logging
- `OnboardingModal`: User onboarding flow
- `RandomFactWidget`: Daily trivia display

### Media Intelligence
We pull our data from several high-end sources:
*   **TMDB**: The backbone for posters, synopses, cast, crew, and basic metadata
*   **OMDB**: For the deep technical trivia and technical specs (cameras, formats, sound)
*   **Spotify**: To link composers and their scores directly to the app
*   **AniList**: Anime and animation content database
*   **Trakt**: User tracking and social features (integrated via user profiles)

### Advanced Features
*   **Real-time Updates**: Live notifications and activity feeds
*   **Offline Support**: Cached content for offline viewing
*   **Progressive Web App**: Installable on mobile devices
*   **Advanced Caching**: Intelligent data prefetching and caching
*   **Performance Optimization**: Code splitting, lazy loading, image optimization
*   **Accessibility**: Full keyboard navigation and screen reader support
*   **Internationalization**: Multi-language support structure
*   **Analytics**: User behavior tracking and insights

---

## 🎨 The Design Philosophy
*   **Glassmorphism**: We use background blurs and subtle borders to make the app feel like it's made of floating glass.
*   **Dark Mode First**: Because movies are best watched in the dark.
*   **Fluid Motion**: Every click should feel tactile. Whether it's a subtle scale effect or a smooth slide, the app is designed to feel alive.
*   **Cinematic Typography**: Custom fonts and spacing inspired by film posters
*   **Mood-Based Color System**: Dynamic colors based on cinematic classifications
*   **Responsive Design**: Perfect experience across all device sizes
*   **Micro-interactions**: Delightful animations for every user action

---

## 🔧 Development & Deployment

**Build System:**
- Next.js 16 with Turbopack for fast builds
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS v4 for styling

**Database Migrations:**
- Comprehensive SQL migrations for all features
- Row Level Security (RLS) policies
- Real-time subscriptions enabled
- Automated profile creation triggers

**Environment Configuration:**
- Supabase integration for auth and database
- TMDB API for media data
- Spotify API for music integration
- Environment-specific configurations

**Production Ready Features:**
- Error boundaries and error handling
- Loading states and skeleton screens
- Optimistic updates for better UX
- Comprehensive logging and monitoring
- Security headers and best practices

---

Enjoy your archive! 🍿