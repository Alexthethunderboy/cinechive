import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <AuthForm mode="login" />
    </div>
  );
}
