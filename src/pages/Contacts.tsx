import { useEffect, useState } from 'react'
import { supabase, Contact, Customer } from '../lib/supabase'
import { Plus, Search, Edit2, Trash2, X, RefreshCw, Star } from 'lucide-react'

interface ContactWithCustomer extends Contact {
  customer_name?: string
}

export default function Contacts() {
  const [contacts, setContacts] = useState<ContactWithCustomer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    customer_id: 0,
    name: '',
    email: '',
    phone: '',
    position: '',
    is_primary: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [contactsRes, customersRes] = await Promise.all([
        supabase.from('contacts').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name').order('name')
      ])

      const contactsList = contactsRes.data || []
      const customersList = customersRes.data || []

      // 关联客户名称
      const contactsWithCustomer = contactsList.map(contact => ({
        ...contact,
        customer_name: customersList.find(c => c.id === contact.customer_id)?.name
      }))

      setContacts(contactsWithCustomer)
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
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update(formData)
          .eq('id', editingContact.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('contacts').insert([formData])
        if (error) throw error
      }
      
      await loadData()
      closeModal()
    } catch (error) {
      console.error('保存联系人失败:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个联系人吗？')) return
    
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('删除联系人失败:', error)
    }
  }

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      customer_id: contact.customer_id,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      is_primary: contact.is_primary
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingContact(null)
    setFormData({
      customer_id: customers[0]?.id || 0,
      name: '',
      email: '',
      phone: '',
      position: '',
      is_primary: false
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingContact(null)
  }

  const filteredContacts = contacts.filter(contact => {
    return searchTerm === '' || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">联系人管理</h1>
          <p className="text-gray-500 mt-1">管理客户的联系人信息</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          添加联系人
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索联系人姓名、邮箱或所属客户..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>暂无联系人数据</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">姓名</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">所属客户</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">职位</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">邮箱</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">电话</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">主联系人</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{contact.name}</td>
                  <td className="px-6 py-4 text-gray-600">{contact.customer_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{contact.position || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{contact.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{contact.phone || '-'}</td>
                  <td className="px-6 py-4">
                    {contact.is_primary && (
                      <span className="inline-flex items-center gap-1 text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        主联系人
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingContact ? '编辑联系人' : '添加联系人'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                <input
                  type="text"
                  className="input"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_primary" className="text-sm text-gray-700">设为主联系人</label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="btn btn-secondary">取消</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? '保存中...' : editingContact ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
