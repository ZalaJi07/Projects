import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import * as api from '../api/index.js';
import { useTheme } from '../context/ThemeContext.jsx';

// Google accounts were created with the Google sub ID as their password (not bcrypt)
// so checking for the bcrypt prefix ($2) is a reliable way to detect them
const isGoogleAccount = (profile) => {
    const pass = profile?.result?.password;
    return pass !== undefined && !pass?.startsWith('$2');
};

const Profile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { theme, setTheme } = useTheme();
    const [themeLoading, setThemeLoading] = useState(false);

    const profileRaw = JSON.parse(localStorage.getItem('profile') || 'null');
    const user = profileRaw?.result;
    const isGoogle = isGoogleAccount(profileRaw);

    // ── Username form state ──
    const [username, setUsername] = useState(user?.username || '');
    const [usernameLoading, setUsernameLoading] = useState(false);

    // ── Password form state ──
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    if (!user) {
        navigate('/auth');
        return null;
    }

    const joinDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';

    // Update localStorage and dispatch so Navbar re-reads on next location change
    const refreshProfile = (result, token) => {
        localStorage.setItem('profile', JSON.stringify({ result, token }));
        // Navbar reads from localStorage on location changes, dispatching triggers that
        dispatch({ type: 'PROFILE_UPDATED', payload: result });
    };

    const handleUsernameSubmit = async (e) => {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed) return;
        if (trimmed === user.username) {
            toast('Username is the same — nothing to change.', { icon: 'ℹ️' });
            return;
        }
        setUsernameLoading(true);
        try {
            const { data } = await api.updateProfile({ username: trimmed });
            refreshProfile(data.result, data.token);
            toast.success('Username updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update username.');
        } finally {
            setUsernameLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = pwForm;
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters.');
            return;
        }
        setPwLoading(true);
        try {
            const { data } = await api.updateProfile({ currentPassword, newPassword });
            refreshProfile(data.result, data.token);
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success('Password updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password.');
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[var(--bg)]">

            {/* Header */}
            <div className="bg-[var(--surface)] px-4 sm:px-8 py-6 shadow-md">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-[var(--primary)] flex items-center justify-center font-bold text-2xl uppercase text-white shadow-lg">
                            {user.username?.[0]}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{user.username}</h1>
                            <p className="text-sm text-white/50">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        My List
                    </button>
                </div>
            </div>

            {/* Cards */}
            <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

                {/* Account info */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Account Info</h2>
                    <div className="flex flex-col gap-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-gray-800">{user.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500">Member since</span>
                            <span className="font-medium text-gray-800">{joinDate}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500">Account type</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isGoogle ? 'bg-blue-100 text-blue-600' : 'text-[var(--primary)]'}`}
                                style={isGoogle ? {} : { background: 'var(--row-border)' }}>
                                {isGoogle ? 'Google' : 'Email'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Change username */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Change Username</h2>
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">warning</span>
                        Changing your username will break your existing share link.
                    </p>
                    <form onSubmit={handleUsernameSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="New username"
                            minLength={2}
                            maxLength={30}
                            required
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition"
                        />
                        <button
                            type="submit"
                            disabled={usernameLoading || !username.trim() || username.trim() === user.username}
                            className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {usernameLoading
                                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : 'Save'
                            }
                        </button>
                    </form>
                </div>

                {/* Change password */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Change Password</h2>

                    {isGoogle ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
                            <span className="material-symbols-outlined text-base">info</span>
                            Password changes are not available for Google accounts.
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={pwForm.currentPassword}
                                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                    placeholder="Current password"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition pr-10"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={pwForm.newPassword}
                                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                    placeholder="New password (min 6 characters)"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={pwForm.confirmPassword}
                                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none transition"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={showPasswords}
                                        onChange={() => setShowPasswords(v => !v)}
                                        className="accent-[var(--primary)]"
                                    />
                                    Show passwords
                                </label>
                                <button
                                    type="submit"
                                    disabled={pwLoading || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                                    className="bg-[var(--primary)] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {pwLoading
                                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : 'Update Password'
                                    }
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                {/* Theme picker */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Appearance</h2>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: 'orange',  label: 'Orange Dusk',  primary: '#E67E22', surface: '#2C3E50' },
                            { key: 'ocean',   label: 'Ocean Blue',   primary: '#3B82F6', surface: '#0F1E35' },
                            { key: 'emerald', label: 'Emerald',      primary: '#10B981', surface: '#0C1F18' },
                            { key: 'violet',  label: 'Violet Night', primary: '#8B5CF6', surface: '#1A1033' },
                            { key: 'rose',    label: 'Rose',         primary: '#F43F5E', surface: '#1C0A12' },
                        ].map(t => (
                            <button
                                key={t.key}
                                title={t.label}
                                disabled={themeLoading}
                                onClick={async () => {
                                    setThemeLoading(true);
                                    await setTheme(t.key);
                                    setThemeLoading(false);
                                    toast.success(`Theme changed to ${t.label}`);
                                }}
                                className="flex flex-col items-center gap-1.5 group disabled:opacity-60"
                            >
                                {/* Swatch: two-tone circle showing surface + primary */}
                                <div
                                    className="w-11 h-11 rounded-full border-2 transition-all overflow-hidden shadow-sm"
                                    style={{
                                        borderColor: theme === t.key ? t.primary : 'transparent',
                                        boxShadow: theme === t.key ? `0 0 0 2px ${t.primary}40` : undefined,
                                    }}
                                >
                                    <div className="w-full h-1/2" style={{ background: t.surface }} />
                                    <div className="w-full h-1/2" style={{ background: t.primary }} />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{t.label}</span>
                                {theme === t.key && (
                                    <span className="material-symbols-outlined text-sm" style={{ color: t.primary }}>check_circle</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
