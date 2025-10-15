import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaCrown, FaStar, FaUserShield, FaSearch } from 'react-icons/fa';

const MembersPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Kun admin har adgang til denne side');
      navigate('/');
      return;
    }
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/admin/members`, {
        withCredentials: true
      });
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Kunne ikke hente medlemmer');
    } finally {
      setLoading(false);
    }
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '', role: 'guest' });
  const [resetPassword, setResetPassword] = useState('');

  const updateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`${API}/admin/members/${userId}/role`, 
        { role: newRole },
        { withCredentials: true }
      );
      toast.success('Brugerrolle opdateret!');
      fetchMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Kunne ikke opdatere rolle');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/members/create`, createForm, {
        withCredentials: true
      });
      toast.success('Bruger oprettet!');
      setIsCreateModalOpen(false);
      setCreateForm({ email: '', name: '', password: '', role: 'guest' });
      fetchMembers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke oprette bruger');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/members/${selectedUser.id}/reset-password`, 
        { password: resetPassword },
        { withCredentials: true }
      );
      toast.success('Password nulstillet!');
      setIsResetModalOpen(false);
      setResetPassword('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.detail || 'Kunne ikke nulstille password');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FaUserShield className="text-red-500" />;
      case 'editor': return <FaCrown className="text-purple-500" />;
      case 'pro': return <FaStar className="text-green-500" />;
      default: return <FaUsers className="text-gray-400" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'editor': return 'bg-purple-100 text-purple-700';
      case 'pro': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <FaUsers className="text-cyan-500" />
          Medlemmer
        </h1>
        <p className="text-gray-600">Administrer brugere og roller</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Søg efter navn eller email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Alle roller</option>
            <option value="guest">Gæst</option>
            <option value="pro">Pro</option>
            <option value="editor">Redaktør</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{members.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {members.filter(m => m.role === 'pro').length}
            </div>
            <div className="text-xs text-green-600">Pro</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {members.filter(m => m.role === 'editor').length}
            </div>
            <div className="text-xs text-purple-600">Redaktør</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {members.filter(m => m.role === 'guest').length}
            </div>
            <div className="text-xs text-gray-600">Gæst</div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Bruger
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Oprettet
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{member.name}</div>
                        {member.id === user?.id && (
                          <span className="text-xs text-cyan-600">(Dig)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(member.created_at).toLocaleDateString('da-DK')}
                  </td>
                  <td className="px-6 py-4">
                    {member.id !== user?.id && (
                      <select
                        value={member.role}
                        onChange={(e) => updateUserRole(member.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="guest">Gæst</option>
                        <option value="pro">Pro</option>
                        <option value="editor">Redaktør</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Ingen medlemmer fundet
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;
