import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, User, Trash2, RefreshCw } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates.jsx';
import { userService } from '../services/userService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate } from '../utils/formatters.js';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'SALES_USER' : 'ADMIN';
    try {
      await userService.updateUserRole(targetUser.id, newRole);
      success(`Updated ${targetUser.name}'s role to ${newRole}`);
      loadUsers();
    } catch (err) {
      toastError(err.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await userService.deleteUser(deletingUser.id);
      success('User deleted successfully');
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      toastError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Team & Role-Based Access Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer workspace accounts and enforce RBAC permissions (ADMIN vs SALES_USER).
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadUsers} icon={RefreshCw}>
          Refresh Users
        </Button>
      </div>

      <Card bodyClassName="p-0">
        {loading ? (
          <LoadingState message="Loading team members..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadUsers} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {u.name[0]}
                        </div>
                        <div>
                          <p>{u.name} {isCurrent && <span className="text-[10px] text-indigo-600 font-normal">(You)</span>}</p>
                          <p className="text-[11px] font-normal text-slate-500 font-mono">{u.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isCurrent && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleRole(u)}
                            >
                              Make {isAdmin ? 'SALES_USER' : 'ADMIN'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700"
                              onClick={() => setDeletingUser(u)}
                              icon={Trash2}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete User Dialog */}
      {deletingUser && (
        <ConfirmDialog
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          title="Delete User Account"
          message={`Are you sure you want to delete ${deletingUser.name} (${deletingUser.email})?`}
          confirmText="Delete User"
        />
      )}
    </div>
  );
}
