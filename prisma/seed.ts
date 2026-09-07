import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const prisma = new PrismaClient({ adapter })

// ====== BAGIAN GAMPANG DIUBAH ======
const SIZES = ['M', 'L', 'XL', 'XXL']
const STOCK_BY_SIZE: Record<string, number> = { M: 15, L: 12, XL: 8, XXL: 5 }
// ====================================

function makeVariants(skuPrefix: string, colors: { code: string; name: string }[]) {
  const variants: { sku: string; color: string; size: string; stock: number }[] = []
  for (const color of colors) {
    for (const size of SIZES) {
      variants.push({
        sku: `${skuPrefix}-${color.code}-${size}`,
        color: color.name,
        size,
        stock: STOCK_BY_SIZE[size] ?? 10,
      })
    }
  }
  return variants
}

async function upsertCategory(name: string, slug: string) {
  return prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } })
}

async function upsertProductWithVariants(params: {
  name: string; slug: string; description: string; basePrice: number
  categoryId: string; imageUrl: string
  variants: { sku: string; color: string; size: string; stock: number }[]
}) {
  const existing = await prisma.product.findUnique({ where: { slug: params.slug } })

  if (existing) {
    await prisma.product.update({
      where: { slug: params.slug },
      data: { variants: { deleteMany: {}, create: params.variants } },
    })
    console.log(`"${params.name}": ${params.variants.length} varian diperbarui.`)
    return existing
  }

  const created = await prisma.product.create({
    data: {
      name: params.name,
      slug: params.slug,
      description: params.description,
      basePrice: params.basePrice,
      categoryId: params.categoryId,
      images: { create: [{ url: params.imageUrl, isPrimary: true }] },
      variants: { create: params.variants },
    },
  })
  console.log(`"${params.name}": produk baru dibuat dengan ${params.variants.length} varian.`)
  return created
}

async function main() {
  const pakaianPria = await upsertCategory('Pakaian Pria', 'pakaian-pria')
  const pakaianWanita = await upsertCategory('Pakaian Wanita', 'pakaian-wanita')

  await upsertProductWithVariants({
    name: 'Kaos Polos Premium', slug: 'kaos-polos-premium',
    description: 'Kaos polos bahan katun combed 30s, nyaman dipakai sehari-hari.',
    basePrice: 85000, categoryId: pakaianPria.id,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
    variants: makeVariants('KPP', [{ code: 'BLK', name: 'Hitam' }, { code: 'WHT', name: 'Putih' }]),
  })

  await upsertProductWithVariants({
    name: 'Blouse Wanita Katun', slug: 'blouse-wanita-katun',
    description: 'Blouse bahan katun ringan dengan potongan longgar, nyaman untuk sehari-hari.',
    basePrice: 95000, categoryId: pakaianWanita.id,
    imageUrl: 'https://picsum.photos/seed/blouse-wanita-katun/600/600',
    variants: makeVariants('BWK', [{ code: 'WHT', name: 'Putih' }, { code: 'PNK', name: 'Pink' }]),
  })

  await upsertProductWithVariants({
    name: 'Dress Casual Midi', slug: 'dress-casual-midi',
    description: 'Dress midi motif polos, cocok dipakai untuk acara santai maupun kerja.',
    basePrice: 165000, categoryId: pakaianWanita.id,
    imageUrl: 'https://picsum.photos/seed/dress-casual-midi/600/600',
    variants: makeVariants('DCM', [{ code: 'BLK', name: 'Hitam' }, { code: 'NVY', name: 'Navy' }]),
  })

  await upsertProductWithVariants({
    name: 'Rok Plisket Midi', slug: 'rok-plisket-midi',
    description: 'Rok plisket bahan jatuh, cocok dipadukan dengan atasan apapun.',
    basePrice: 120000, categoryId: pakaianWanita.id,
    imageUrl: 'https://picsum.photos/seed/rok-plisket-midi/600/600',
    variants: makeVariants('RPM', [{ code: 'BLK', name: 'Hitam' }, { code: 'BEI', name: 'Beige' }]),
  })

  await upsertProductWithVariants({
    name: 'Cardigan Rajut', slug: 'cardigan-rajut',
    description: 'Cardigan rajut lembut, cocok dipakai di cuaca dingin atau ber-AC.',
    basePrice: 135000, categoryId: pakaianWanita.id,
    imageUrl: 'https://picsum.photos/seed/cardigan-rajut/600/600',
    variants: makeVariants('CR', [{ code: 'CRM', name: 'Cream' }, { code: 'GRY', name: 'Abu-abu' }]),
  })

  await upsertProductWithVariants({
    name: 'Celana Kulot Wanita', slug: 'celana-kulot-wanita',
    description: 'Celana kulot bahan katun stretch, potongan lebar dan nyaman dipakai.',
    basePrice: 110000, categoryId: pakaianWanita.id,
    imageUrl: 'https://picsum.photos/seed/celana-kulot-wanita/600/600',
    variants: makeVariants('CKW', [{ code: 'BLK', name: 'Hitam' }]),
  })

  console.log('Seed selesai: semua produk sekarang punya varian ukuran M-XXL.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
