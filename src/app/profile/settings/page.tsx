import ProfileSettingsUI from '@/components/profile/ProfileSettingsUI';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Settings | CineChive",
  description: "Manage your profile and account preferences.",
};

export default function SettingsPage() {
  return (
    <div className="bg-black min-h-screen text-white">
      <ProfileSettingsUI />
    </div>
  );
}
