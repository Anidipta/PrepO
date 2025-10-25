// Simple IndexedDB wrapper for client-side persistence

const DB_NAME = "prepo_db"
const DB_VERSION = 1
const STORE_USERS = "users"
const STORE_ACTIVITIES = "activities"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: "address" })
      }
      if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
        const store = db.createObjectStore(STORE_ACTIVITIES, { keyPath: "id", autoIncrement: true })
        store.createIndex("byAddress", "address")
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function initDB(): Promise<void> {
  await openDB()
}

export async function getUser(address: string): Promise<any | null> {
  if (!address) return null
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USERS, "readonly")
    const store = tx.objectStore(STORE_USERS)
    const req = store.get(address)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function saveUser(user: { address: string; name: string; role: string; createdAt?: number }) {
  const db = await openDB()
  const tx = db.transaction(STORE_USERS, "readwrite")
  const store = tx.objectStore(STORE_USERS)
  user.createdAt = user.createdAt || Date.now()
  return new Promise((resolve, reject) => {
    const req = store.put(user)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function logActivity(address: string, activity: { type: string; payload?: any; timestamp?: number }) {
  const db = await openDB()
  const tx = db.transaction(STORE_ACTIVITIES, "readwrite")
  const store = tx.objectStore(STORE_ACTIVITIES)
  const entry = { address, type: activity.type, payload: activity.payload || null, timestamp: activity.timestamp || Date.now() }
  return new Promise((resolve, reject) => {
    const req = store.add(entry)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getActivitiesFor(address: string) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ACTIVITIES, "readonly")
    const store = tx.objectStore(STORE_ACTIVITIES)
    const idx = store.index("byAddress")
    const req = idx.getAll(address)
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}
