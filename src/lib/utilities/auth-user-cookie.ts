import { browser } from '$app/environment';
import { parseWithBigInt } from './parse-with-big-int';
import { atob } from '$lib/utilities/atob';

type UserResponse = {
  AccessToken: string;
  IDToken: string;
  Name: string;
  Email: string;
  Picture: string;
};

const cookieName = 'user';

export const getAuthUserCookie = (isBrowser = browser): User => {
  if (!isBrowser) return {};

  const cookies = document.cookie.split(';');
  let i = 0;
  let next = cookies.find((c) => c.includes(cookieName + i));
  let userBase64 = '';

  while (next) {
    const [_, value] = next.split('=');

    userBase64 += value;
    i++;
    next = cookies.find((c) => c.includes(cookieName + i));
  }

  if (userBase64) {
    try {
      const userS = atob(userBase64);
      const user: UserResponse = parseWithBigInt(userS);

      return {
        accessToken: user?.AccessToken,
        idToken: user?.IDToken,
        name: user?.Name,
        picture: user?.Picture,
        email: user?.Email,
      };
    } catch (e) {
      console.error(e);
    }
  }

  return {};
};

export const cleanAuthUserCookie = (isBrowser = browser) => {
  if (!isBrowser) return;

  const cookies = document.cookie.split(';');
  let i = 0;
  let next = cookies.find((c) => c.includes(cookieName + i));

  while (next) {
    const [name] = next.split('=');
    document.cookie = `${name}=; max-age=-1; path=/`;
    i++;
    next = cookies.find((c) => c.includes(cookieName + i));
  }
};
