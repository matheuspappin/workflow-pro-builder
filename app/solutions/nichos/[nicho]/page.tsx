import { notFound } from "next/navigation"
import { redirect } from "next/navigation"
import { nicheDictionary } from "@/config/niche-dictionary"
import {
  getThemeForNiche,
  isVerticalizationNiche,
  VERTICALIZATION_LANDING_URL,
} from "@/config/niche-landing-theme"
import { getNicheLandingContent } from "@/config/niche-landing-content"
import { NicheLandingClient } from "./niche-landing-client"

interface PageProps {
  params: Promise<{ nicho: string }>
}

export default async function NicheLandingRoute({ params }: PageProps) {
  const { nicho } = await params

  if (isVerticalizationNiche(nicho)) {
    const url = VERTICALIZATION_LANDING_URL[nicho]
    if (url) redirect(url)
  }

  const dict = (nicheDictionary.pt as Record<string, { name: string; client?: string; provider?: string; service?: string; establishment?: string }>)[nicho]
  if (!dict) {
    notFound()
  }

  const theme = getThemeForNiche(nicho)
  const vocab = {
    client: dict.client ?? "Cliente",
    provider: dict.provider ?? "Profissional",
    service: dict.service ?? "Serviço",
    establishment: dict.establishment ?? "Estabelecimento",
    name: dict.name,
  }
  const content = getNicheLandingContent(nicho, theme, vocab)

  return (
    <NicheLandingClient
      niche={nicho}
      nicheName={dict.name}
      content={content}
      registerUrl={`/register?niche=${nicho}`}
      loginUrl="/login"
    />
  )
}
