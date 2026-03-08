import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import { PageLoader } from '@/components/loaders/spinner';

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
