/**
 * Converts numbers to Persian words (e.g., 250000 -> دویست و پنجاه هزار)
 */
const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertGroup(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];

  const h = Math.floor(num / 100);
  const r = num % 100;

  if (h > 0) parts.push(hundreds[h]);

  if (r >= 10 && r < 20) {
    parts.push(teens[r - 10]);
  } else {
    const t = Math.floor(r / 10);
    const u = r % 10;
    if (t > 0) parts.push(tens[t]);
    if (u > 0) parts.push(units[u]);
  }

  return parts.join(' و ');
}

export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر';
  if (isNaN(num)) return '';

  const isNegative = num < 0;
  let absNum = Math.abs(Math.floor(num));

  const groups: string[] = [];
  let scaleIndex = 0;

  while (absNum > 0) {
    const groupVal = absNum % 1000;
    if (groupVal > 0) {
      const groupText = convertGroup(groupVal);
      const scaleText = scales[scaleIndex];
      groups.unshift(scaleText ? `${groupText} ${scaleText}` : groupText);
    }
    absNum = Math.floor(absNum / 1000);
    scaleIndex++;
  }

  const result = groups.join(' و ');
  return (isNegative ? 'منفی ' : '') + result;
}
