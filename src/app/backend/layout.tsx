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
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <a href="/backend/presets" className="text-blue-600 hover:text-blue-800">
                    Presets
                  </a>
                </li>
                <li>
                  <a href="/backend" className="text-gray-600 hover:text-gray-800">
                    Back to Game
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
