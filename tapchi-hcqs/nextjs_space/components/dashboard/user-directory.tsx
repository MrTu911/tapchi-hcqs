'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageSquare, Loader2, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  org?: string;
}

interface UserDirectoryProps {
  currentUserId: string;
  currentUserRole: string;
  onStartChat: (userId: string) => void;
}

const roleLabels: Record<string, string> = {
  AUTHOR: 'Tác giả',
  REVIEWER: 'Phản biện',
  SECTION_EDITOR: 'BT Chuyên mục',
  MANAGING_EDITOR: 'Tổng Biên tập',
  EIC: 'Tổng Chủ biên',
  LAYOUT_EDITOR: 'BT Bố cục',
  SYSADMIN: 'Quản trị viên',
};

const roleColors: Record<string, string> = {
  AUTHOR: 'bg-blue-100 text-blue-800',
  REVIEWER: 'bg-pink-100 text-pink-800',
  SECTION_EDITOR: 'bg-purple-100 text-purple-800',
  MANAGING_EDITOR: 'bg-orange-100 text-orange-800',
  EIC: 'bg-red-100 text-red-800',
  LAYOUT_EDITOR: 'bg-green-100 text-green-800',
  SYSADMIN: 'bg-gray-100 text-gray-800',
};

/**
 * Matrix phân quyền chat (theo Blind Review Policy)
 * Author không chat trực tiếp với Reviewer
 */
const canChatMatrix: Record<string, string[]> = {
  AUTHOR: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  REVIEWER: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  SECTION_EDITOR: ['AUTHOR', 'REVIEWER', 'MANAGING_EDITOR', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN'],
  MANAGING_EDITOR: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN'],
  EIC: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'LAYOUT_EDITOR', 'SYSADMIN'],
  LAYOUT_EDITOR: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  SYSADMIN: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'LAYOUT_EDITOR'],
};

export function UserDirectory({ currentUserId, currentUserRole, onStartChat }: UserDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all users initially
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();

      if (data.success) {
        // Lọc users theo matrix và loại trừ chính mình
        const allowedRoles = canChatMatrix[currentUserRole] || [];
        const eligible = data.data.filter(
          (u: User) => u.id !== currentUserId && allowedRoles.includes(u.role)
        );
        setUsers(eligible);
        setFilteredUsers(eligible);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUserId, currentUserRole]);

  // Filter users based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.org && u.org.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          Danh bạ
        </CardTitle>
        <CardDescription>
          {filteredUsers.length} người có thể trò chuyện
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user.fullName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {roleLabels[user.role] || user.role}
                    </Badge>
                    {user.org && (
                      <span className="text-xs text-muted-foreground truncate">
                        {user.org}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStartChat(user.id)}
                  className="flex-shrink-0"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
