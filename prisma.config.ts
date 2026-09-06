import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
    migrations: {
    seed: "tsx prisma/seed.ts",
        path: "prisma/migrations",
          },
            datasource: {
                // pakai DIRECT_URL (bukan yang lewat pgbouncer) karena migrate butuh koneksi langsung
                    url: env("DIRECT_URL"),
                      },
                      });