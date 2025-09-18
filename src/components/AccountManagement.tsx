import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Search, Filter, X } from 'lucide-react';
import { Account, Category } from '../types';
import CategoryManagement from './CategoryManagement';

interface AccountManagementProps {
  accounts: Account[];
  categories: Category[];
  onAddAccount: (account: Omit<Account, 'id' | 'created_at' | 'account_code'>) => void;
  onUpdateAccount: (id: string, account: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'created_at'>) => void;
  onUpdateCategory: (id: string, category: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({
  accounts,
  categories,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentData, setSelectedPaymentData] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'violation' | 'inactive',
    payment_data: 'belum diatur' as 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah',
    category_id: '',
    user_id: null as string | null,
  });

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || account.category_id === selectedCategory;
    const matchesPaymentData = selectedPaymentData === 'all' || account.payment_data === selectedPaymentData;
    
    return matchesSearch && matchesCategory && matchesPaymentData;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      onUpdateAccount(editingAccount.id, formData);
    } else {
      onAddAccount({
        ...formData,
        user_id: null, // Will be set by the backend or can be assigned later
      });
    }
    
    setShowModal(false);
    setEditingAccount(null);
    const belumDiaturCategory = categories.find(cat => cat.name === 'Belum Diatur');
    setFormData({ 
      username: '', 
      email: '', 
      phone: '', 
      status: 'active', 
      payment_data: 'belum diatur', 
      category_id: belumDiaturCategory?.id || '', 
      user_id: null 
    });
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      username: account.username,
      email: account.email,
      phone: account.phone,
      status: account.status,
      payment_data: account.payment_data,
      category_id: account.category_id,
      user_id: account.user_id,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    const belumDiaturCategory = categories.find(cat => cat.name === 'Belum Diatur');
    setFormData({ 
      username: '', 
      email: '', 
      phone: '', 
      status: 'active', 
      payment_data: 'belum diatur', 
      category_id: belumDiaturCategory?.id || '', 
      user_id: null 
    });
    setShowModal(true);
  };

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'Belum Diatur';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Belum Diatur';
  };

  const getStatusBadge = (status: 'active' | 'violation' | 'inactive') => {
    const statusConfig = {
      active: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
      violation: { label: 'Pelanggaran', color: 'bg-red-100 text-red-800' },
      inactive: { label: 'Non-Aktif', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentDataBadge = (paymentData: 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah') => {
    const paymentConfig = {
      'belum diatur': { label: 'Belum Diatur', color: 'bg-gray-100 text-gray-800' },
      utamakan: { label: 'Utamakan', color: 'bg-yellow-100 text-yellow-800' },
      dimasukkan: { label: 'Dimasukkan', color: 'bg-blue-100 text-blue-800' },
      disetujui: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      sah: { label: 'Sah', color: 'bg-purple-100 text-purple-800' }
    };
    
    const config = paymentConfig[paymentData];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleInlineUpdate = (accountId: string, field: string, value: string) => {
    onUpdateAccount(accountId, { [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <p className="text-gray-600">Manage your affiliate accounts and product categories</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Category Management */}
      <CategoryManagement
        categories={categories}
        onAddCategory={onAddCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Payment:</span>
              <select
                value={selectedPaymentData}
                onChange={(e) => setSelectedPaymentData(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Payment Status</option>
                <option value="belum diatur">Belum Diatur</option>
                <option value="utamakan">Utamakan</option>
                <option value="dimasukkan">Dimasukkan</option>
                <option value="disetujui">Disetujui</option>
                <option value="sah">Sah</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Accounts ({filteredAccounts.length})
          </h3>
        </div>
        
        {filteredAccounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Pembayaran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{account.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {account.account_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={account.status}
                        onChange={(e) => handleInlineUpdate(account.id, 'status', e.target.value)}
                        className="text-xs font-medium border-0 bg-transparent focus:ring-2 focus:ring-purple-500 rounded-full px-2.5 py-0.5 cursor-pointer"
                        style={{
                          backgroundColor: account.status === 'active' ? '#dcfce7' : 
                                         account.status === 'violation' ? '#fee2e2' : '#f3f4f6',
                          color: account.status === 'active' ? '#166534' : 
                                account.status === 'violation' ? '#991b1b' : '#374151'
                        }}
                      >
                        <option value="active">Aktif</option>
                        <option value="violation">Pelanggaran</option>
                        <option value="inactive">Non-Aktif</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={account.payment_data}
                        onChange={(e) => handleInlineUpdate(account.id, 'payment_data', e.target.value)}
                        className="text-xs font-medium border-0 bg-transparent focus:ring-2 focus:ring-purple-500 rounded-full px-2.5 py-0.5 cursor-pointer"
                        style={{
                          backgroundColor: account.payment_data === 'belum diatur' ? '#f3f4f6' :
                                         account.payment_data === 'utamakan' ? '#fef3c7' : 
                                         account.payment_data === 'dimasukkan' ? '#dbeafe' : 
                                         account.payment_data === 'disetujui' ? '#dcfce7' : '#f3e8ff',
                          color: account.payment_data === 'belum diatur' ? '#374151' :
                                account.payment_data === 'utamakan' ? '#92400e' : 
                                account.payment_data === 'dimasukkan' ? '#1e40af' : 
                                account.payment_data === 'disetujui' ? '#166534' : '#7c3aed'
                        }}
                      >
                        <option value="belum diatur">Belum Diatur</option>
                        <option value="utamakan">Utamakan</option>
                        <option value="dimasukkan">Dimasukkan</option>
                        <option value="disetujui">Disetujui</option>
                        <option value="sah">Sah</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={account.category_id}
                        onChange={(e) => handleInlineUpdate(account.id, 'category_id', e.target.value)}
                        className="text-xs font-medium border-0 bg-blue-100 text-blue-800 focus:ring-2 focus:ring-purple-500 rounded-full px-2.5 py-0.5 cursor-pointer"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(account.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAccount(account.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {accounts.length === 0 ? 'No accounts yet' : 'No accounts match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {accounts.length === 0 
                ? 'Get started by adding your first affiliate account'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {accounts.length === 0 && (
              <button
                onClick={handleAdd}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Your First Account
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAccount ? 'Edit Account' : 'Add New Account'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter email"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Handphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'violation' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="active">Aktif</option>
                    <option value="violation">Pelanggaran</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Pembayaran *
                  </label>
                  <select
                    value={formData.payment_data}
                    onChange={(e) => setFormData({ ...formData, payment_data: e.target.value as 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="belum diatur">Belum Diatur</option>
                    <option value="utamakan">Utamakan</option>
                    <option value="dimasukkan">Dimasukkan</option>
                    <option value="disetujui">Disetujui</option>
                    <option value="sah">Sah</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {/* Find and use the actual "Belum Diatur" category ID */}
                    {(() => {
                      const belumDiaturCategory = categories.find(cat => cat.name === 'Belum Diatur');
                      return belumDiaturCategory ? (
                        <option value={belumDiaturCategory.id}>Belum Diatur</option>
                      ) : (
                        <option value="">Belum Diatur (Not Found)</option>
                      );
                    })()}
                    {categories.map((category) => (
                      category.name !== 'Belum Diatur' ? (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ) : null
                    ))}
                  </select>
                  {categories.length === 0 ? (
                    <p className="text-sm text-amber-600 mt-1">
                      Please create a product category first before adding accounts.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      "Belum Diatur" is the default category for accounts without specific assignment.
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingAccount ? 'Update' : 'Add'} Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;