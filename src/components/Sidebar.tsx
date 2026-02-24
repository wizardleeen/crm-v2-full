import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  TrendingUp, 
  CheckSquare, 
  Activity,
  Settings
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/customers', icon: Users, label: '客户管理' },
  { path: '/contacts', icon: UserCheck, label: '联系人' },
  { path: '/opportunities', icon: TrendingUp, label: '销售机会' },
  { path: '/tasks', icon: CheckSquare, label: '任务管理' },
  { path: '/activities', icon: Activity, label: '活动日志' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📊</span>
          CRM系统
        </h1>
        <p className="text-gray-400 text-sm mt-1">客户关系管理</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button className="sidebar-link w-full text-left">
          <Settings size={20} />
          <span>设置</span>
        </button>
        <div className="mt-4 px-4 text-xs text-gray-500">
          <p>版本: 1.0.0</p>
          <p className="mt-1">Powered by Supabase</p>
        </div>
      </div>
    </aside>
  )
}
