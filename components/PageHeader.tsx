import type {ReactNode} from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function PageHeader({left}: {left: ReactNode}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <div className="text-sm">{left}</div>
      <LanguageSwitcher />
    </div>
  );
}
