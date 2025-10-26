import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prepo'
const DB_NAME = 'prepo'

async function run() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)
  console.log('Connected to', MONGODB_URI)

  const collections = [
    'users',
    'courses',
    'bounties',
    'course_registrations',
    'bounty_registrations',
    'onchain_course_registration_requests',
    'onchain_bounty_registration_requests',
  ]

  for (const name of collections) {
    const coll = db.collection(name)
    // fields to normalize per collection
    const candidateFields = ['address', 'mentorAddress', 'userAddress', 'mentor', 'from', 'to', 'requestedBy']

    for (const field of candidateFields) {
      try {
        const query = { [field]: { $exists: true, $type: 'string' } }
        const docs = await coll.find(query).project({ [field]: 1 }).toArray()
        if (!docs || docs.length === 0) continue
        console.log(`Processing ${docs.length} docs in ${name} for field ${field}`)
        for (const d of docs) {
          const val = d[field]
          if (!val) continue
          const lower = String(val).toLowerCase()
          if (val !== lower) {
            await coll.updateOne({ _id: d._id }, { $set: { [field]: lower } })
          }
        }
      } catch (e) {
        // ignore collections that don't exist
      }
    }
  }

  console.log('Normalization complete')
  await client.close()
}

run().catch((e) => { console.error(e); process.exit(1) })
