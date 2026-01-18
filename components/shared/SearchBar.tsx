'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ placeholder = 'Search by Customer ID, Quotation ID, or Customer Name...', value, onChange }: SearchBarProps) {
  return (
    <div className="w-full">
      <Label htmlFor="search" className="sr-only">Search</Label>
      <Input
        id="search"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
