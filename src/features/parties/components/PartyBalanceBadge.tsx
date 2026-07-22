import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../lib/utils';
import { TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

interface PartyBalanceBadgeProps {
  balance?: number; // positive = debit (بدهکار), negative = credit (بستانکار), 0 = تسویه
  currency?: string;
  showZeroText?: boolean;
}

export function PartyBalanceBadge({
  balance = 0,
  currency = 'تومان',
  showZeroText = true,
}: PartyBalanceBadgeProps) {
  if (balance === 0) {
    if (!showZeroText) return <span className="text-xs text-slate-400">۰ {currency}</span>;
    return (
      <Badge variant="neutral" size="sm">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span>تسویه (۰)</span>
      </Badge>
    );
  }

  if (balance > 0) {
    // بدهکار (Party owes money to business)
    return (
      <Badge variant="warning" size="sm" className="font-bold">
        <TrendingUp className="w-3 h-3 text-amber-600" />
        <span>{formatCurrency(balance, currency)} (بدهکار)</span>
      </Badge>
    );
  }

  // بستانکار (Business owes money to party)
  const absAmt = Math.abs(balance);
  return (
    <Badge variant="success" size="sm" className="font-bold">
      <TrendingDown className="w-3 h-3 text-emerald-600" />
      <span>{formatCurrency(absAmt, currency)} (بستانکار)</span>
    </Badge>
  );
}
