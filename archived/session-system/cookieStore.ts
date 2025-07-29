// FILE: app/src/lib/utils/cookieStore.ts
import { cookies } from 'next/headers';

export const cookieStore = () => cookies(); // Returns ReadonlyRequestCookies