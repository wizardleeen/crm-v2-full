import { useEffect, useState } from 'react'
import { supabase, Customer, Opportunity, Task } from '../lib/supabase'
import { Users, TrendingUp, CheckSquare, DollarSign, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalOpportunities: 0,
    openTasks: 0,
    totalPipeline: 0,
    wonThisMonth: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // 加载客户统计
      const { data: customers } = await supabase.from('customers').select('*')
      const { data: opportunities } = await supabase.from('opportunities').select('*')
      const { data: tasks } = await supabase.from('tasks').select('*')
      const { data: activities } = await supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(10)

      const customerList = customers || []
      const oppList = opportunities || []
      const taskList = tasks || []

      // 计算统计数据
      const totalPipeline = oppList.reduce((sum, opp) => sum + (opp.value || 0), 0)
      const wonThisMonth = oppList
        .filter(opp => opp.stage === 'won')
        .reduce((sum, opp) => sum + (opp.value || 0), 0)

      setStats({
        totalCustomers: customerList.length,
        activeCustomers: customerList.filter(c => c.status === 'customer').length,
        totalOpportunities: oppList.length,
        openTasks: taskList.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
        totalPipeline,
        wonThisMonth
      })

      setRecentActivities(activities || [])
      setOpportunities(oppList)
      
      // 即将到期的任务
      const upcoming = taskList
        .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5)
      setUpcomingTasks(upcoming)

    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      lead: 'lead',
      prospect: 'prospect',
      customer: 'customer',
      inactive: 'inactive',
      won: 'won',
      lost: 'lost',
      pending: 'pending',
      in_progress: 'in_progress',
      completed: 'completed'
    }
    return `badge badge-${statusMap[status] || status}`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value)
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'MM/dd HH:mm', { locale: zhCN })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来！以下是您的业务概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">总客户数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 flex items-center gap-1">
              <ArrowUp size={14} />
              {stats.activeCustomers} 活跃
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">销售机会</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalOpportunities}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              管道价值: {formatCurrency(stats.totalPipeline)}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待处理任务</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.openTasks}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">
              {upcomingTasks.length} 项即将到期
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">本月赢单</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{formatCurrency(stats.wonThisMonth)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 flex items-center gap-1">
              <ArrowUp size={14} />
              成交额
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 销售漏斗 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">销售漏斗</h2>
          <div className="space-y-4">
            {['prospecting', 'qualification', 'proposal', 'negotiation', 'won'].map((stage) => {
              const stageOpp = opportunities.filter(o => o.stage === stage)
              const total = stageOpp.reduce((sum, o) => sum + (o.value || 0), 0)
              const count = stageOpp.length
              const percentage = stats.totalPipeline > 0 ? (total / stats.totalPipeline) * 100 : 0
              
              const stageLabels: Record<string, string> = {
                prospecting: '线索发现',
                qualification: '需求确认',
                proposal: '方案提交',
                negotiation: '商务谈判',
                won: '成交'
              }

              return (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{stageLabels[stage]}</span>
                    <span className="text-gray-500">{count} 个 · {formatCurrency(total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 待办任务 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">待办任务</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无待处理任务</p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <p className="text-sm text-gray-500">{task.due_date ? format(new Date(task.due_date), 'MM/dd', { locale: zhCN }) : '无截止日期'}</p>
                  </div>
                  <span className={getStatusBadge(task.status)}>{task.status === 'pending' ? '待处理' : task.status === 'in_progress' ? '进行中' : task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近活动 */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">最近活动</h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无活动记录</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{activity.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
