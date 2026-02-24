import { useEffect, useState } from 'react'
import { supabase, Opportunity, Customer } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface OpportunityWithCustomer extends Opportunity {
  customer_name?: string
}

const stageOptions = [
  { value: 'prospecting', label: '线索发现', color: 'gray' },
  { value: 'qualification', label: '需求确认', color: 'yellow' },
  { value: 'proposal', label: '方案提交', color: 'blue' },
  { value: 'negotiation', label: '商务谈判', color: 'purple' },
  { value: 'won', label: '成交', color: 'green' },
  { value: 'lost', label: '失败', color: 'red' },
]

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<OpportunityWithCustomer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    customer_id: 0,
    title: '',
    value: 0,
    stage: 'prospecting',
    probability: 0,
    expected_close_date: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [oppRes, customersRes] = await Promise.all([
        supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name').order('name')
      ])

      const oppList = oppRes.data || []
      const customersList = customersRes.data || []

      const oppWithCustomer = oppList.map(opp => ({
        ...opp,
        customer_name: customersList.find(c => c.id === opp.customer_id)?.name
      }))

      setOpportunities(oppWithCustomer)
      setCustomers(customersList)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...formData,
        expected_close_date: formData.expected_close_date || null
      }

      if (editingOpp) {
        const { error } = await supabase
          .from('opportunities')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingOpp.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('opportunities').insert([data])
        if (error) throw error
      }
      
      await loadData()
      closeModal()
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个销售机会吗？')) return
    
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const openEditModal = (opp: Opportunity) => {
    setEditingOpp(opp)
    setFormData({
      customer_id: opp.customer_id,
      title: opp.title,
      value: opp.value || 0,
      stage: opp.stage,
      probability: opp.probability || 0,
      expected_close_date: opp.expected_close_date || '',
      notes: opp.notes || ''
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingOpp(null)
    setFormData({
      customer_id: customers[0]?.id || 0,
      title: '',
      value: 0,
      stage: 'prospecting',
      probability: 0,
      expected_close_date: '',
      notes: ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingOpp(null)
  }

  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = searchTerm === '' || 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStage = stageFilter === '' || opp.stage === stageFilter
    
    return matchesSearch && matchesStage
  })

  const getStageBadge = (stage: string) => {
    const stageMap: Record<string, string> = {
      prospecting: 'lead',
      qualification: 'prospect',
      proposal: 'in_progress',
      negotiation: 'prospect',
      won: 'won',
      lost: 'lost'
    }
    return `badge badge-${stageMap[stage]}`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value)
  }

  // 统计
  const totalValue = filteredOpps.reduce((sum, o) => sum + (o.value || 0), 0)
  const wonValue = filteredOpps.filter(o => o.stage === 'won').reduce((sum, o) => sum + (o.value || 0), 0)
  const weightedValue = filteredOpps.reduce((sum, o) => sum + (o.value || 0) * (o.probability || 0) / 100, 0)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">销售机会</h1>
          <p className="text-gray-500 mt-1">管理销售管道和商机</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          添加机会
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <DollarSign className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">总价值</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">已成交</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(wonValue)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">加权价值</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(weightedValue)}</p>
          </div>
        </div>
      </div>

      {/* 搜索筛选 */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索机会标题或客户..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input w-auto"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">全部阶段</option>
            {stageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 列表 */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOpps.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>暂无销售机会</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">机会名称</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">客户</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">金额</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">阶段</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">概率</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">预计成交日</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOpps.map((opp) => (
                <tr key={opp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{opp.title}</td>
                  <td className="px-6 py-4 text-gray-600">{opp.customer_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">{formatCurrency(opp.value || 0)}</td>
                  <td className="px-6 py-4">
                    <span className={getStageBadge(opp.stage)}>
                      {stageOptions.find(s => s.value === opp.stage)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${opp.probability === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${opp.probability || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{opp.probability || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {opp.expected_close_date ? format(new Date(opp.expected_close_date), 'yyyy/MM/dd', { locale: zhCN }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(opp)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(opp.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingOpp ? '编辑销售机会' : '添加销售机会'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    机会名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所属客户 <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>请选择客户</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">阶段</label>
                  <select
                    className="input"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                  >
                    {stageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成功概率 (%)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">预计成交日期</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    className="input min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="btn btn-secondary">取消</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? '保存中...' : editingOpp ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
