'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

// IndexedDB key constants
const IDB_DB_NAME = 'prism-secret-chat'
const IDB_STORE_NAME = 'keys'

async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly')
    const store = tx.objectStore(IDB_STORE_NAME)
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite')
    const store = tx.objectStore(IDB_STORE_NAME)
    const req = store.put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function ab2b64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function b642ab(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

interface UseSecretChatReturn {
  encryptMessage: (text: string) => Promise<string>
  decryptMessage: (ciphertext: string) => Promise<string>
  isReady: boolean
}

export function useSecretChat(chatId: string, otherUid: string): UseSecretChatReturn {
  const [isReady, setIsReady] = useState(false)
  const ownKeyPairRef = useRef<CryptoKeyPair | null>(null)

  useEffect(() => {
    if (!chatId || !otherUid) return

    const init = async () => {
      try {
        const idbKey = `secret-chat-keypair-${chatId}`

        // Check IndexedDB for existing private key
        const existingPrivKey = await idbGet<ArrayBuffer>(`${idbKey}-private`)
        const existingPubKey = await idbGet<ArrayBuffer>(`${idbKey}-public`)

        let keyPair: CryptoKeyPair

        if (existingPrivKey && existingPubKey) {
          // Re-import stored key pair
          const privateKey = await crypto.subtle.importKey(
            'pkcs8',
            existingPrivKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['decrypt']
          )
          const publicKey = await crypto.subtle.importKey(
            'spki',
            existingPubKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['encrypt']
          )
          keyPair = { privateKey, publicKey }
        } else {
          // Generate new RSA-OAEP key pair
          keyPair = await crypto.subtle.generateKey(
            { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
            true,
            ['encrypt', 'decrypt']
          )

          // Export and store in IndexedDB
          const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
          const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
          await idbSet(`${idbKey}-private`, privateKeyBuffer)
          await idbSet(`${idbKey}-public`, publicKeyBuffer)

          // Upload public key to Firestore chat doc
          const pubKeyB64 = ab2b64(publicKeyBuffer)
          await updateDoc(doc(db, 'chats', chatId), {
            [`secretChatKeys.ownPublicKey`]: pubKeyB64,
          }).catch(() => {})
        }

        ownKeyPairRef.current = keyPair
        setIsReady(true)
      } catch (err) {
        console.error('[useSecretChat] init error:', err)
      }
    }

    init()
  }, [chatId, otherUid])

  const encryptMessage = useCallback(
    async (text: string): Promise<string> => {
      if (!isReady) throw new Error('Secret chat not ready')

      // Fetch other party's public key from Firestore
      const chatSnap = await getDoc(doc(db, 'chats', chatId))
      if (!chatSnap.exists()) throw new Error('Chat not found')

      const chatData = chatSnap.data()
      const otherPubKeyB64: string | undefined = chatData?.secretChatKeys?.[otherUid]
      if (!otherPubKeyB64) throw new Error('Other user public key not available')

      const otherPubKeyBuffer = b642ab(otherPubKeyB64)
      const otherPublicKey = await crypto.subtle.importKey(
        'spki',
        otherPubKeyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
      )

      const encoded = new TextEncoder().encode(text)
      const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, otherPublicKey, encoded)
      return ab2b64(encrypted)
    },
    [chatId, otherUid, isReady]
  )

  const decryptMessage = useCallback(
    async (ciphertext: string): Promise<string> => {
      if (!isReady || !ownKeyPairRef.current) throw new Error('Secret chat not ready')

      const encryptedBuffer = b642ab(ciphertext)
      const decrypted = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        ownKeyPairRef.current.privateKey,
        encryptedBuffer
      )
      return new TextDecoder().decode(decrypted)
    },
    [isReady]
  )

  return { encryptMessage, decryptMessage, isReady }
}
