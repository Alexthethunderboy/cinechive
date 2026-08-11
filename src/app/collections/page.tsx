import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Library | CineChive",
  description: "Your personal registry of cinematic works and acquired frequencies.",
};

export default function CollectionsPage() {
  redirect('/vault');
}
