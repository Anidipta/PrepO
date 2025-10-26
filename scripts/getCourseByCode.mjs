#!/usr/bin/env node
/*
  getCourseByCode.mjs

  Usage:
    MONGODB_URI="mongodb://localhost:27017/prepo" node scripts/getCourseByCode.mjs --code <COURSE_CODE>

  Output: prints the course document (JSON) and a compact summary (Mongo _id, mentorAddress, fee)
*/

import { MongoClient } from 'mongodb'

function usageAndExit(msg) {
  if (msg) console.error(msg)
  console.log('\nUsage:')
  console.log('  MONGODB_URI environment variable must be set (or use the default mongodb://localhost:27017/prepo)')
  console.log('  node scripts/getCourseByCode.mjs --code <COURSE_CODE>')
  process.exit(msg ? 1 : 0)
}

const argv = process.argv.slice(2)
let code
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--code') code = argv[++i]
}

if (!code) usageAndExit('Missing --code parameter')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prepo'
const DB_NAME = process.env.DB_NAME || 'prepo'

;(async () => {
  let client
  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(DB_NAME)
    const courses = db.collection('courses')

    const course = await courses.findOne({ code })
    if (!course) {
      console.error('Course not found for code:', code)
      process.exit(2)
    }

    console.log('Course document:')
    console.log(JSON.stringify(course, null, 2))
    console.log('\nSummary:')
    console.log('  _id:', course._id)
    console.log('  code:', course.code)
    console.log('  title:', course.title)
    console.log('  mentorAddress:', course.mentorAddress)
    console.log('  fee:', course.fee)

    // If _id is an ObjectId, print its hex string if available
    if (course._id && course._id.toHexString) {
      console.log('  _id (hex):', course._id.toHexString())
    }

    process.exit(0)
  } catch (err) {
    console.error('Error fetching course:', err)
    process.exit(1)
  } finally {
    if (client) await client.close()
  }
})()
