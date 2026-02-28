import { NextResponse } from "next/server"
import { getVerticalizations } from "@/lib/actions/verticalization"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const verticalizations = await getVerticalizations()
    return NextResponse.json(verticalizations)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
