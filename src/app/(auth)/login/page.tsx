import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import AuthLoader from '@/components/loaders/auth-loader';

export default function LoginPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center bg-muted justify-center p-6">
      <Suspense fallback={<AuthLoader />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
