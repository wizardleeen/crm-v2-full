import { useEffect, useState } from 'react'
import { supabase, Customer } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const statusOptions = [
  { value: 'lead', label: '线索', color: 'gray' },
  { value: 'prospect', label: '潜在客户', color: 'yellow' },
  { value: 'customer', label: '成交客户', color: 'green' },
  { value: 'inactive', label: '未活跃', color: 'red' },
]

const industryOptions = ['互联网', '金融', '制造业', '零售', '教育', '医疗', '房地产', '物流', '本地生活', '其他']
const sourceOptions = ['广告投放', '老客户介绍', '线上咨询', '电话营销', '展会', '官网', '合作伙伴', '其他']

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    status: 'lead',
    source: '',
    notes: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('加载客户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingCustomer.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('customers').insert([formData])
        if (error) throw error
      }
      
      await loadCustomers()
      closeModal()
    } catch (error) {
      console.error('保存客户失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个客户吗？此操作不可撤销。')) return
    
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      await loadCustomers()
    } catch (error) {
      console.error('删除客户失败:', error)
      alert('删除失败，该客户可能有关联数据')
    }
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      industry: customer.industry || '',
      status: customer.status,
      source: customer.source || '',
      notes: customer.notes || ''
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      industry: '',
      status: 'lead',
      source: '',
      notes: ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === '' || customer.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      lead: 'lead',
      prospect: 'prospect',
      customer: 'customer',
      inactive: 'inactive'
    }
    return `badge badge-${statusMap[status]}`
  }

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
          <p className="text-gray-500 mt-1">管理您的客户信息</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          添加客户
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索客户名称、公司或邮箱..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button onClick={loadCustomers} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw size={18} />
            刷新
          </button>
        </div>
      </div>

      {/* 客户列表 */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>暂无客户数据</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">客户名称</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">公司</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">邮箱</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">电话</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">行业</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">状态</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">来源</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">创建时间</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{customer.name}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.company || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.industry || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(customer.status)}>{getStatusLabel(customer.status)}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.source || '-'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {customer.created_at ? format(new Date(customer.created_at), 'yyyy/MM/dd', { locale: zhCN }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingCustomer ? '编辑客户' : '添加新客户'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客户名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">行业</label>
                  <select
                    className="input"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="">请选择行业</option>
                    {industryOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户状态</label>
                  <select
                    className="input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户来源</label>
                  <select
                    className="input"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    <option value="">请选择来源</option>
                    {sourceOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    className="input min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="添加备注信息..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  取消
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? '保存中...' : editingCustomer ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
