import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserMenu() {
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

  const initial = profile?.full_name
    ? profile.full_name.charAt(0)
    : user.email?.charAt(0) || 'U';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center justify-center p-0.5 rounded-full border border-slate-200 dark:border-[#2f2f3a] hover:border-slate-300 dark:hover:border-[#3e3e4d] bg-slate-50 dark:bg-[#1a1a20] hover:bg-slate-100 dark:hover:bg-[#24242c] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30"
          aria-label="User account"
        >
          <div className="w-7 h-7 rounded-full bg-[#205ae3] text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
            {initial}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="w-56">
        <DropdownMenuLabel className="font-normal px-3 py-2">
          <div className="flex flex-col space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white truncate text-xs">
              {profile?.full_name || 'Custumu Member'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#205ae3] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 uppercase tracking-wide">
                {profile?.tier || 'Free'} Plan
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/30 cursor-pointer px-3 py-2 text-xs"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
