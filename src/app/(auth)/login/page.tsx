import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import AuthLoader from '@/components/loaders/auth-loader';

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={<AuthLoader />}>
      <LoginForm />
    </Suspense>
  );
}
