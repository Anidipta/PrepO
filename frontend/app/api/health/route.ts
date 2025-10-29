import { connectToDatabase } from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    // check a cheap operation
    const collections = await db.listCollections().toArray()
    return NextResponse.json({ ok: true, collections: collections.map((c: any) => c.name) })
  } catch (err) {
    console.error('Health check failed:', err)
    return NextResponse.json({ ok: false, error: (err as any)?.message || String(err) }, { status: 500 })
  }
}
