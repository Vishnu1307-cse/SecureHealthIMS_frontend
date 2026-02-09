import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { TopHeader } from '../components/TopHeader'

export const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex w-full flex-col">
        <TopHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
