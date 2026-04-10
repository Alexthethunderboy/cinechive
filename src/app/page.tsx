import { Metadata } from 'next';
import ClientHome from '@/components/home/ClientHome';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: "Cinema | Home",
  description: "Your personalized cinematic feed, curated by style and community activity.",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If user is logged in, fetch their profile for onboarding check
  let fullUser = null;
  if (user) {
    let profile = null;
    let retries = 3;
    
    while (retries > 0 && !profile) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        profile = data;
        break;
      }
      
      // Wait 500ms before retry
      await new Promise(resolve => setTimeout(resolve, 500));
      retries--;
    }
    
    fullUser = { ...user, profile, profileBootstrapPending: !profile };
  }

  return <ClientHome user={fullUser} />;
}
