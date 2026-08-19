/**
 * Client-side ECDH encryption for Prism Secret Chats.
 *
 * Architecture:
 *  - Key agreement:  P-256 ECDH
 *  - Symmetric enc:  AES-GCM 256-bit (derived via HKDF from ECDH shared secret)
 *  - Private keys:   Stored in IndexedDB (never leave the device)
 *  - Public keys:    Exported as base64 strings and stored in Firestore
 */

const DB_NAME = 'prism-keys'
const STORE_NAME = 'private-keys'
const DB_VERSION = 1

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── Key generation ───────────────────────────────────────────────────────────

/**
 * Generate a new P-256 ECDH key pair.
 * Returns the public key as a base64 string (safe to store in Firestore)
 * and the raw CryptoKey for the private key.
 */
export async function generateKeyPair(): Promise<{
  publicKey: string
  privateKey: CryptoKey
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,  // extractable — needed to export public key; private stays non-exportable below
    ['deriveKey'],
  )

  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey)

  return {
    publicKey: publicKeyBase64,
    privateKey: keyPair.privateKey,
  }
}

// ─── Key import / export ──────────────────────────────────────────────────────

/**
 * Export a CryptoKey public key to a base64 string for Firestore storage.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('spki', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
}

/**
 * Import a base64 public key string from Firestore into a CryptoKey.
 */
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  )
}

// ─── IndexedDB persistence ────────────────────────────────────────────────────

/**
 * Persist a private CryptoKey in IndexedDB, keyed by chatId.
 * The key never leaves this device.
 */
export async function storePrivateKey(
  chatId: string,
  key: CryptoKey,
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(key, chatId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

/**
 * Retrieve a stored private key from IndexedDB by chatId.
 * Returns null if not found (e.g. new device, cleared storage).
 */
export async function getPrivateKey(chatId: string): Promise<CryptoKey | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(chatId)
    request.onsuccess = () => {
      resolve((request.result as CryptoKey | undefined) ?? null)
      db.close()
    }
    request.onerror = () => reject(request.error)
  })
}

// ─── Shared secret derivation ─────────────────────────────────────────────────

/**
 * Derive a 256-bit AES-GCM key from the ECDH shared secret using HKDF.
 * Both sides derive the same key without ever transmitting it.
 */
async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string using AES-GCM with a shared ECDH key.
 * Returns a base64-encoded string of: [12-byte IV || ciphertext].
 */
export async function encryptMessage(
  plaintext: string,
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<string> {
  const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey)

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded,
  )

  // Prepend IV to ciphertext for easy extraction on decrypt
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a base64-encoded ciphertext (IV || ciphertext) using AES-GCM.
 * Returns the original plaintext string.
 */
export async function decryptMessage(
  ciphertext: string,
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<string> {
  const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey)

  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    data,
  )

  return new TextDecoder().decode(plaintext)
}
