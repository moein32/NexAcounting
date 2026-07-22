import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { PartyType, PartyRoleType } from '../../../types/party';
import { Building2, User, Landmark, HelpCircle, ShoppingCart, Truck, UserCheck } from 'lucide-react';

interface PartyTypeBadgeProps {
  type: PartyType;
  key?: React.Key;
}

export function PartyTypeBadge({ type }: PartyTypeBadgeProps) {
  switch (type) {
    case 'individual':
      return (
        <Badge variant="info" size="sm">
          <User className="w-3 h-3" />
          <span>حقیقی</span>
        </Badge>
      );
    case 'company':
      return (
        <Badge variant="primary" size="sm">
          <Building2 className="w-3 h-3" />
          <span>حقوقی</span>
        </Badge>
      );
    case 'organization':
      return (
        <Badge variant="neutral" size="sm">
          <Landmark className="w-3 h-3" />
          <span>سازمان</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm">
          <HelpCircle className="w-3 h-3" />
          <span>سایر</span>
        </Badge>
      );
  }
}

interface PartyRoleBadgeProps {
  role: PartyRoleType;
  key?: React.Key;
}

export function PartyRoleBadge({ role }: PartyRoleBadgeProps) {
  switch (role) {
    case 'customer':
      return (
        <Badge variant="success" size="sm">
          <ShoppingCart className="w-3 h-3" />
          <span>مشتری</span>
        </Badge>
      );
    case 'supplier':
      return (
        <Badge variant="warning" size="sm">
          <Truck className="w-3 h-3" />
          <span>تأمین‌کننده</span>
        </Badge>
      );
    case 'employee':
      return (
        <Badge variant="info" size="sm">
          <UserCheck className="w-3 h-3" />
          <span>پرسنل</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="sm">
          <span>سایر</span>
        </Badge>
      );
  }
}
