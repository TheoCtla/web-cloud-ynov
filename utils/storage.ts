import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export async function uploadToFirebase(uri: string, name: string): Promise<string> {
  const fetchResponse = await fetch(uri);
  const blob = await fetchResponse.blob();

  const imageRef = ref(storage, `images/${name}`);
  const uploadTask = await uploadBytes(imageRef, blob);

  return getDownloadURL(uploadTask.ref);
}
