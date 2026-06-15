import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminFetchUsers, adminDisableUser, adminRemoveUser } from '../api/index.js';

// Debounce hook
function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Confirm delete modal state
    const [confirmModal, setConfirmModal] = useState({ open: false, user: null });
    const [actionLoading, setActionLoading] = useState(null); // stores id of in-progress action

    const debouncedSearch = useDebounce(search, 400);

    const fetchUsers = useCallback(async (pg, srch) => {
        setLoading(true);
        try {
            const { data } = await adminFetchUsers(pg, 20, srch);
            setUsers(data.data);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load users.';
            toast.error(msg);
            if (err.response?.status === 403) navigate('/');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchUsers(page, debouncedSearch);
    }, [page, debouncedSearch, fetchUsers]);

    // Stats derived from current page (full stats would need a separate endpoint — keeping it lightweight)
    const stats = {
        total: totalItems,
        active: users.filter(u => !u.isDisabled && !u.isAdmin).length,
        disabled: users.filter(u => u.isDisabled).length,
        admin: users.filter(u => u.isAdmin).length,
    };

    const handleDisable = async (user) => {
        setActionLoading(user._id);
        try {
            const { data } = await adminDisableUser(user._id);
            toast.success(data.message);
            setUsers(prev => prev.map(u =>
                u._id === user._id ? { ...u, isDisabled: data.isDisabled } : u
            ));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const openConfirm = (user) => setConfirmModal({ open: true, user });
    const closeConfirm = () => setConfirmModal({ open: false, user: null });

    const handleRemove = async () => {
        const user = confirmModal.user;
        if (!user) return;
        closeConfirm();
        setActionLoading(user._id);
        try {
            const { data } = await adminRemoveUser(user._id);
            toast.success(data.message);
            setUsers(prev => prev.filter(u => u._id !== user._id));
            setTotalItems(prev => prev - 1);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Remove failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-4 sm:p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--surface)]">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage all user accounts</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[var(--primary)] transition font-medium"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to My List
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Users', value: totalItems, icon: 'group', color: 'text-[var(--surface)]' },
                    { label: 'Active', value: stats.active, icon: 'check_circle', color: 'text-green-600' },
                    { label: 'Disabled', value: stats.disabled, icon: 'block', color: 'text-red-500' },
                    { label: 'Admin', value: stats.admin, icon: 'admin_panel_settings', color: 'text-[var(--primary)]' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                        <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-2 mb-4 bg-white rounded-xl shadow-sm px-4 py-2.5 max-w-md">
                <span className="material-symbols-outlined text-gray-400 text-base">search</span>
                <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                />
                {search && (
                    <button onClick={() => setSearch('')}>
                        <span className="material-symbols-outlined text-gray-400 text-base hover:text-gray-600">close</span>
                    </button>
                )}
            </div>

            {/* User table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                        <span className="w-5 h-5 border-2 border-gray-300 border-t-[var(--primary)] rounded-full animate-spin" />
                        Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                        <span className="material-symbols-outlined text-4xl">manage_accounts</span>
                        <p className="text-sm">{search ? 'No users match your search.' : 'No users found.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Email</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Joined</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Anime</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => {
                                    const isBusy = actionLoading === user._id;
                                    return (
                                        <tr key={user._id} className="hover:bg-gray-50 transition">
                                            {/* Username + avatar */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white flex-shrink-0 ${user.isAdmin ? 'bg-[var(--primary)]' : user.isDisabled ? 'bg-gray-300' : 'bg-[var(--surface)]'}`}>
                                                        {user.username?.[0] || '?'}
                                                    </div>
                                                    <a className="font-medium text-gray-800 truncate max-w-[100px]" href={`http://animelistmanager.netlify.app/list/${user.username}`} target="_blank">{user.username}</a>
                                                </div>
                                            </td>
                                            {/* Email */}
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell truncate max-w-[160px]">
                                                {user.email}
                                            </td>
                                            {/* Joined */}
                                            <td className="px-4 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            {/* Anime count */}
                                            <td className="px-4 py-3 text-center font-semibold text-[var(--surface)]">
                                                {user.animeCount}
                                            </td>
                                            {/* Status badge */}
                                            <td className="px-4 py-3">
                                                {user.isAdmin ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[var(--primary)] text-xs font-semibold" style={{ background: 'var(--row-border)' }}>
                                                        Admin
                                                    </span>
                                                ) : user.isDisabled ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                                                        Disabled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                {user.isAdmin ? (
                                                    <span className="text-xs text-gray-300 block text-right">—</span>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Disable / Enable toggle */}
                                                        <button
                                                            onClick={() => handleDisable(user)}
                                                            disabled={isBusy}
                                                            title={user.isDisabled ? 'Enable account' : 'Disable account'}
                                                            className={`p-1.5 rounded-lg transition disabled:opacity-50 ${user.isDisabled ? 'hover:bg-green-50 text-green-500' : 'hover:bg-[var(--row-bg)] text-[var(--primary)]'}`}
                                                        >
                                                            {isBusy ? (
                                                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-lg">
                                                                    {user.isDisabled ? 'lock_open' : 'block'}
                                                                </span>
                                                            )}
                                                        </button>
                                                        {/* Remove */}
                                                        <button
                                                            onClick={() => openConfirm(user)}
                                                            disabled={isBusy}
                                                            title="Remove account permanently"
                                                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition"
                    >
                        <span className="material-symbols-outlined text-base text-gray-600">chevron_left</span>
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition"
                    >
                        <span className="material-symbols-outlined text-base text-gray-600">chevron_right</span>
                    </button>
                </div>
            )}

            {/* Confirm Remove Modal */}
            {confirmModal.open && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-[fadeIn_0.15s_ease-out]"
                    onClick={closeConfirm}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-red-500 text-xl">delete_forever</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">Remove Account</h3>
                                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            You are about to permanently delete{' '}
                            <strong className="text-gray-800">{confirmModal.user?.username}</strong>'s account and all their anime data.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeConfirm}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemove}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
