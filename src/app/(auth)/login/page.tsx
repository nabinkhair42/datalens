import { Suspense } from 'react';

import { LoginCore } from '@/components/auth/login-core';
import AuthLoader from '@/components/loaders/auth-loader';

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={<AuthLoader />}>
      <LoginCore />
    </Suspense>
  );
}
