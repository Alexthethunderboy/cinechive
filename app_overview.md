# CineChive: The Vibe & The Tech

Welcome to **CineChive**! If you're a film lover who cares about the details—the lighting, the sound, the mood—you're in the right place. We built this for curators, not just "watchers." 

Here’s a breakdown of what the app does, how to use it, and a little bit of the magic under the hood.

---

## 🎬 What is CineChive?
CineChive is a high-end digital sanctuary for your movie collection. Instead of just a boring list, we focus on the **vibe**. We categorize films by their "cinematic style" (like *Atmospheric*, *Noir*, or *Visceral*) so you can find exactly what you’re in the mood for.

### 🌟 Core Experience (The Fun Stuff)

#### 1. Discovery & The "Everything" Bar
*   **The Home Feed**: Fresh, trending movies and shows presented in a beautiful, immersive layout.
*   **Discover by Mood**: Tired of just "Action" or "Drama"? You can browse by **Cinematic Vibes**. Want something moody? Hit *Melancholic*. Want something raw? Hit *Visceral*.
*   **Global Search**: One search bar for everything—movies, TV shows, actors, and directors. 

#### 2. Your Private Library (The Vault)
*   **Saving**: Save anything to your personal "Vault." You can track what you’ve watched, what you’re currently watching, or what you’re planning to see.
*   **Collections**: Think of these as custom playlists for movies. You can group films however you want (e.g., "Neon Dreams," "Depressing Sundays," or "Essential Scifi"). 

#### 3. Deep Dive into Media
When you click a movie, we don’t just show you a poster. We give you:
*   **Technical Specs**: For the nerds—we show what camera was used (Arri, Panavision), the film format (35mm, IMAX), and the sound mix (Dolby Atmos, DTS).
*   **Trivia & Deep Dives**: Cool facts and production history you won't find on a standard landing page.
*   **Related Traversal**: Click a director or a composer, and you’re instantly exploring their entire body of work.

#### 4. The Society (The Community)
*   **Dispatches**: These are like mini-blog posts. You can share thorough thoughts on a film with your followers.
*   **TikTok-style Reposts**: Found a cool post? "Collect" it, and it show up on your feed as a repost, giving credit to the original creator.
*   **Following**: Build a network of other cinephiles whose taste you trust.

#### 5. CineJournal & Ratings
*   **Track your Screenings**: Log exactly when you watched a film and what you thought of it.
*   **Ratings**: Grade films on a elegant 1-5 star scale. Your history is saved in a beautiful, chronological journal.

#### 6. Profile & Cinematic Styles
*   **Your Style**: Your profile avatar isn't just a picture—it has "Styles" (like glowing borders or cinematic effects) based on your personality.
*   **Stats**: See how many minutes you’ve spent in the cinema, how many curators follow you, and more.

---

## 🛠️ Under the Hood (The Tech Stuffs)
For those who want to know how the car is built:

### The Architecture
*   **Framework**: Based on **Next.js 16 (App Router)** and **React 19**. It’s incredibly fast and uses **Server Actions** for secure, server-side data handling.
*   **State Management**: We use **Tanstack React Query** to handle super-fast loading and caching, so once you see a poster, it’s there to stay.
*   **Backend**: Powered by **Supabase**. It handles everything from our database and secure logins to real-time notifications.
*   **The Look**: Styled with **Tailwind CSS v4** (the latest and greatest) and **Vanilla CSS** for that pixel-perfect editorial control.
*   **Motion**: All those smooth transitions and pop-ups? That’s **Framer Motion v12** handling physics-based animations.

### Media Intelligence
We pull our data from several high-end sources:
*   **TMDB**: The backbone for posters and synopses.
*   **OMDB**: For the deep technical trivia and technical specs.
*   **Spotify**: To link composers and their scores directly to the app.

---

## 🎨 The Design Philosophy
*   **Glassmorphism**: We use background blurs and subtle borders to make the app feel like it’s made of floating glass.
*   **Dark Mode First**: Because movies are best watched in the dark. 
*   **Fluid Motion**: Every click should feel tactile. Whether it’s a subtle scale effect or a smooth slide, the app is designed to feel alive.

---

Enjoy your archive! 🍿
