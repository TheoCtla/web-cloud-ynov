import { updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export async function updateUserPhotoUrl(downloadUrl: string): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await updateProfile(auth.currentUser, { photoURL: downloadUrl });
    return true;
  } catch {
    return false;
  }
}
