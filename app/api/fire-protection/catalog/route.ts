import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

// Catálogo padrão fire protection para quando o studio não tem produtos/serviços cadastrados
const DEFAULT_PRODUCTS = [
  { id: 'default-p1', name: 'Extintor PQS 4kg', category: 'Extintores', price: 85.00, unit: 'un', is_default: true },
  { id: 'default-p2', name: 'Extintor PQS 6kg', category: 'Extintores', price: 110.00, unit: 'un', is_default: true },
  { id: 'default-p3', name: 'Extintor CO2 6kg', category: 'Extintores', price: 180.00, unit: 'un', is_default: true },
  { id: 'default-p4', name: 'Extintor Água 10L', category: 'Extintores', price: 130.00, unit: 'un', is_default: true },
  { id: 'default-p5', name: 'Extintor AP 10L', category: 'Extintores', price: 95.00, unit: 'un', is_default: true },
  { id: 'default-p6', name: 'Mangueira de Incêndio 25m', category: 'Hidrantes', price: 220.00, unit: 'un', is_default: true },
  { id: 'default-p7', name: 'Esguicho Simples', category: 'Hidrantes', price: 45.00, unit: 'un', is_default: true },
  { id: 'default-p8', name: 'Placa Saída de Emergência', category: 'Sinalização', price: 18.00, unit: 'un', is_default: true },
  { id: 'default-p9', name: 'Placa Extintor (Fotoluminescente)', category: 'Sinalização', price: 12.00, unit: 'un', is_default: true },
  { id: 'default-p10', name: 'Detector de Fumaça', category: 'Detecção', price: 65.00, unit: 'un', is_default: true },
  { id: 'default-p11', name: 'Sprinkler (unidade)', category: 'Detecção', price: 28.00, unit: 'un', is_default: true },
  { id: 'default-p12', name: 'Suporte para Extintor', category: 'Acessórios', price: 15.00, unit: 'un', is_default: true },
]

const DEFAULT_SERVICES = [
  { id: 'default-s1', name: 'Recarga Extintor PQS (até 6kg)', category: 'Recargas', price: 35.00, is_default: true },
  { id: 'default-s2', name: 'Recarga Extintor CO2', category: 'Recargas', price: 65.00, is_default: true },
  { id: 'default-s3', name: 'Recarga Extintor Água', category: 'Recargas', price: 40.00, is_default: true },
  { id: 'default-s4', name: 'Vistoria Técnica', category: 'Vistorias', price: 150.00, is_default: true },
  { id: 'default-s5', name: 'Laudo AVCB', category: 'Laudos', price: 350.00, is_default: true },
  { id: 'default-s6', name: 'Mão de Obra — Instalação', category: 'Mão de Obra', price: 120.00, is_default: true },
  { id: 'default-s7', name: 'Mão de Obra — Manutenção', category: 'Mão de Obra', price: 90.00, is_default: true },
  { id: 'default-s8', name: 'Teste de Hidrantes', category: 'Vistorias', price: 200.00, is_default: true },
  { id: 'default-s9', name: 'Inspeção de Sprinklers', category: 'Vistorias', price: 180.00, is_default: true },
  { id: 'default-s10', name: 'Treinamento de Brigada (2h)', category: 'Treinamentos', price: 450.00, is_default: true },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const search = searchParams.get('search') ?? ''
    const category = searchParams.get('category') ?? ''

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    // Buscar produtos cadastrados do studio
    let productsQuery = supabaseAdmin
      .from('products')
      .select('id, name, price, unit, current_stock, category, sku, barcode')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('name')

    if (search) productsQuery = productsQuery.ilike('name', `%${search}%`)
    if (category) productsQuery = productsQuery.eq('category', category)

    // Buscar serviços cadastrados do studio
    let servicesQuery = supabaseAdmin
      .from('services')
      .select('id, name, price, duration_minutes, category')
      .eq('studio_id', studioId)
      .eq('is_active', true)
      .order('name')

    if (search) servicesQuery = servicesQuery.ilike('name', `%${search}%`)
    if (category) servicesQuery = servicesQuery.eq('category', category)

    const [{ data: products }, { data: services }] = await Promise.all([
      productsQuery,
      servicesQuery,
    ])

    const productList = (products && products.length > 0)
      ? products.map((p) => ({ ...p, item_type: 'product', is_default: false }))
      : DEFAULT_PRODUCTS.filter((p) =>
          (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
          (!category || p.category === category)
        )

    const serviceList = (services && services.length > 0)
      ? services.map((s) => ({ ...s, item_type: 'service', unit: 'un', is_default: false }))
      : DEFAULT_SERVICES.filter((s) =>
          (!search || s.name.toLowerCase().includes(search.toLowerCase())) &&
          (!category || s.category === category)
        ).map((s) => ({ ...s, item_type: 'service', unit: 'un' }))

    // Categorias disponíveis
    const productCategories = [...new Set(productList.map((p) => p.category).filter(Boolean))]
    const serviceCategories = [...new Set(serviceList.map((s) => s.category).filter(Boolean))]

    return NextResponse.json({
      products: productList,
      services: serviceList,
      categories: {
        products: productCategories,
        services: serviceCategories,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
