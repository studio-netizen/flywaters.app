import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

const SEOHead = ({
  title,
  description,
  canonical,
  ogImage = 'https://flywaters.app/og-image.jpg',
  ogType = 'website',
}: SEOHeadProps) => {
  const { t, i18n } = useTranslation();
  const resolvedTitle = title || t('seo.defaultTitle');
  const resolvedDesc = description || t('seo.defaultDescription');

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDesc} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEOHead;
