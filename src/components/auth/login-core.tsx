import { LoginBranding } from '@/components/auth/login-branding';
import { LoginForm } from '@/components/auth/login-form';

export function LoginCore() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <LoginBranding />
      <LoginForm />
    </div>
  );
}
