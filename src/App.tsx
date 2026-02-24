import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Contacts from './pages/Contacts'
import Opportunities from './pages/Opportunities'
import Tasks from './pages/Tasks'
import Activities from './pages/Activities'
import { supabase } from './lib/supabase'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 测试Supabase连接
    const testConnection = async () => {
      try {
        const { error } = await supabase.from('customers').select('count', { count: 'exact' })
        if (error) {
          console.error('Supabase连接错误:', error)
          setError(error.message)
        }
        setLoading(false)
      } catch (err) {
        console.error('连接失败:', err)
        setError('数据库连接失败')
        setLoading(false)
      }
    }
    testConnection()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">数据库连接失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">请确保已在Supabase中执行DDL脚本创建表和示例数据</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/activities" element={<Activities />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
