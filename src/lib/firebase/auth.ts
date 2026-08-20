import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { generateUsername } from '@/lib/utils/generateId'

const googleProvider = new GoogleAuthProvider()

/**
 * Sign in with Google via popup.
 * If the user is new, creates their Firestore profile document.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  // Create doc only on first sign-in (additionalUserInfo.isNewUser)
  // We do an upsert with merge so existing users are not overwritten
  const userRef = doc(db, 'users', user.uid)
  await setDoc(
    userRef,
    {
      uid: user.uid,
      displayName: user.displayName ?? '',
      username: generateUsername(user.displayName ?? user.uid),
      email: user.email ?? '',
      photoURL: user.photoURL ?? null,
      bio: '',
      customStatus: '',
      presence: 'online',
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        mutedChats: [],
        fcmToken: null,
      },
      sessionDevices: [],
      followerCount: 0,
      followingCount: 0,
    },
    { merge: true },
  )

  return user
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * Register a new account with email, password, and display name.
 * Creates the Firebase Auth user, sets their display name, and writes
 * the initial Firestore user document.
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  const user = result.user

  // Update Firebase Auth profile
  await updateProfile(user, { displayName })

  // Write initial Firestore user document
  const userRef = doc(db, 'users', user.uid)
  await setDoc(userRef, {
    uid: user.uid,
    displayName,
    username: generateUsername(displayName),
    email,
    photoURL: null,
    bio: '',
    customStatus: '',
    presence: 'online',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
    settings: {
      theme: 'light',
      notificationsEnabled: true,
      mutedChats: [],
      fcmToken: null,
    },
    sessionDevices: [],
    followerCount: 0,
    followingCount: 0,
  })

  return user
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

/**
 * Subscribe to authentication state changes.
 * Returns the unsubscribe function.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback)
}
