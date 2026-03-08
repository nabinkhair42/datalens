import { createApiResponse, createErrorResponse, getSession } from '@/lib/api-utils';

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return createErrorResponse('Unauthorized', 401);
  }

  return createApiResponse({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    createdAt: session.user.createdAt,
    updatedAt: session.user.updatedAt,
  });
}
