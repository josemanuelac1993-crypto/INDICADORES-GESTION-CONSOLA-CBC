import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token cache (never stored in localStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getCachedAccessToken = () => cachedAccessToken;

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: credential.accessToken
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  cachedAccessToken = null;
  await firebaseSignOut(auth);
};
