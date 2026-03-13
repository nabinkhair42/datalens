'use client';

import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import { SignoutDialog } from '@/components/dialogs';
import { Avatar, AvatarFallback, AvatarImage, getInitials } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AuthUser } from '@/hooks/use-auth';

interface UserControlProps {
  user: AuthUser;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const UserControl = memo(function UserControl({
  user,
  onLogout,
  isLoggingOut = false,
}: UserControlProps) {
  const initials = getInitials(user.name, user.email);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="relative size-9 rounded-full p-0">
              <Avatar size="sm">
                {user.image ? <AvatarImage src={user.image} alt={user.name ?? user.email} /> : null}
                <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {user.name && <p className="text-sm font-medium leading-none">{user.name}</p>}
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setShowConfirm(true)}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignoutDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
});
