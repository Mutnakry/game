import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Game administration dashboard",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
