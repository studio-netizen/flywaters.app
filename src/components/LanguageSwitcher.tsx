import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = '' }: { className?: string }) => {
  const { i18n } = useTranslation();
  const isItalian = i18n.language === 'it';

  const toggle = () => {
    const newLang = isItalian ? 'en' : 'it';
    i18n.changeLanguage(newLang);
    localStorage.setItem('flywaters_lang', newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-black/[0.08] hover:bg-muted/50 transition-colors ${className}`}
      title={isItalian ? 'Switch to English' : 'Passa all\'italiano'}
    >
      <span className="text-sm">{isItalian ? '🇮🇹' : '🇬🇧'}</span>
      <span>{isItalian ? 'IT' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;
