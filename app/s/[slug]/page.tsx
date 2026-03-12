import { notFound } from "next/navigation"
import { getPublicStudioBySlug } from "@/lib/actions/studios"
import { StudioLandingPage } from "@/components/landing/studio-landing-page"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function StudioLandingRoute({ params }: PageProps) {
  const { slug } = await params
  const { data: studio, error } = await getPublicStudioBySlug(slug)

  if (error || !studio) {
    notFound()
  }

  const settings = Array.isArray(studio.organization_settings)
    ? studio.organization_settings[0]
    : studio.organization_settings
  const niche = settings?.niche ?? "dance"
  const vocabulary = settings?.vocabulary ?? undefined

  return (
    <StudioLandingPage
      studio={{ name: studio.name, slug: studio.slug }}
      niche={niche}
      vocabulary={vocabulary}
    />
  )
}
