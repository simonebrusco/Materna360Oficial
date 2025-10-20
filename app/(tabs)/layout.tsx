import { Header } from '@/components/ui/Header'
import { TabBar } from '@/components/ui/TabBar'

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header
        title="Materna360"
        showNotification={true}
      />
      <main className="flex-1 pb-24">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
