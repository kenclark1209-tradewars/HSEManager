import { useState } from 'react';
import { getUserRole, setUserRole, getRoleLabel, getRoleColor, ROLES } from '@/lib/roleUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';

/**
 * RoleSwitcher — allows users to switch role in demo/dev mode.
 * In production, roles would come from the User entity.
 */
export default function RoleSwitcher({ className = '' }) {
  const [role, setRole] = useState(getUserRole());

  const handleChange = (newRole) => {
    setUserRole(newRole);
    setRole(newRole);
    window.location.reload(); // refresh to apply role-based UI
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Shield className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Vai trò:</span>
      <Select value={role} onValueChange={handleChange}>
        <SelectTrigger className="h-7 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ROLES.MANAGER}>👔 Quản lý</SelectItem>
          <SelectItem value={ROLES.SUPERVISOR}>🦺 Giám sát</SelectItem>
          <SelectItem value={ROLES.EMPLOYEE}>👷 Nhân viên</SelectItem>
        </SelectContent>
      </Select>
      <Badge className={`text-xs ${getRoleColor(role)}`}>{getRoleLabel(role)}</Badge>
    </div>
  );
}