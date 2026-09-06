import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const category = await prisma.category.create({
    data: { name: 'Pakaian Pria', slug: 'pakaian-pria' },
  })

  await prisma.product.create({
    data: {
      name: 'Kaos Polos Premium',
      slug: 'kaos-polos-premium',
      description: 'Kaos polos bahan katun combed 30s, nyaman dipakai sehari-hari.',
      basePrice: 85000,
      categoryId: category.id,
      images: {
        create: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', isPrimary: true }],
      },
      variants: {
        create: [
          { sku: 'KPP-BLK-M', color: 'Hitam', size: 'M', stock: 20 },
          { sku: 'KPP-BLK-L', color: 'Hitam', size: 'L', stock: 15 },
          { sku: 'KPP-WHT-M', color: 'Putih', size: 'M', stock: 10 },
        ],
      },
    },
  })

  console.log('Seed data berhasil ditambahkan!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
