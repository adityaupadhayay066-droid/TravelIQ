import React from 'react';

export default function UserAvatar({
    name = '',
    email = '',
    image = null,
    size = 'md',
    showBadge = false,
    role = 'user'
}) {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : (email ? email.slice(0, 2).toUpperCase() : 'U');

    const sizeClasses = {
        sm: 'w-7 h-7 text-xs',
        md: 'w-9 h-9 text-sm',
        lg: 'w-12 h-12 text-base font-bold',
        xl: 'w-16 h-16 text-xl font-bold'
    }[size] || 'w-9 h-9 text-sm';

    const getRoleBg = () => {
        if (role === 'admin' || role === 'super_admin') return 'bg-purple-600 text-white';
        if (role === 'data_manager') return 'bg-cyan-600 text-white';
        if (role === 'support_admin') return 'bg-indigo-600 text-white';
        return 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white';
    };

    return (
        <div className="relative inline-flex items-center justify-center shrink-0 select-none">
            {image ? (
                <img
                    src={image}
                    alt={name || email}
                    className={`${sizeClasses} rounded-full object-cover border border-[var(--color-border)] shadow-sm`}
                />
            ) : (
                <div
                    className={`${sizeClasses} rounded-full flex items-center justify-center font-semibold shadow-inner ${getRoleBg()}`}
                >
                    {initials}
                </div>
            )}

            {showBadge && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--color-surface)] shadow-xs" />
            )}
        </div>
    );
}
