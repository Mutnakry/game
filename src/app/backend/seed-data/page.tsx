import SeedDefaultData from "@/components/utils/seed-default-data"

export default function SeedDataPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin - Seed Default Data</h1>
      <SeedDefaultData />
    </div>
  )
}