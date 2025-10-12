export interface Organization {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

export interface Person {
  name: string;
  url?: string;
  jobTitle?: string;
  worksFor?: Organization;
}

export interface WebSite {
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    '@type': string;
    target: string;
    'query-input': string;
  };
}

export interface WebPage {
  '@type': string;
  name: string;
  description: string;
  url: string;
  isPartOf?: {
    '@type': string;
    name: string;
    url: string;
  };
  about?: Organization;
  author?: Person;
  publisher?: Organization;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: {
    '@type': string;
    itemListElement: Array<{
      '@type': string;
      position: number;
      name: string;
      item: string;
    }>;
  };
}

export interface SoftwareApplication {
  '@type': string;
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    ratingCount: number;
  };
}

// Default organization data
export const defaultOrganization: Organization = {
  name: 'CodeRacer',
  url: 'https://coderacer.app',
  logo: 'https://coderacer.app/logo.png',
  description:
    'Real-time coding competition platform for improving programming skills',
};

// Generate organization structured data
export function generateOrganizationStructuredData(
  organization: Organization = defaultOrganization
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    url: organization.url,
    logo: organization.logo,
    description: organization.description,
    sameAs: ['https://github.com/Dongmoon29/code_racer'],
  };
}

// Generate website structured data
export function generateWebsiteStructuredData(website: WebSite) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: website.name,
    url: website.url,
    description: website.description,
    potentialAction: website.potentialAction || {
      '@type': 'SearchAction',
      target: `${website.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// Generate webpage structured data
export function generateWebPageStructuredData(page: WebPage) {
  return {
    '@context': 'https://schema.org',
    ...page,
  };
}

// Generate software application structured data
export function generateSoftwareApplicationStructuredData(
  app: SoftwareApplication
) {
  return {
    '@context': 'https://schema.org',
    ...app,
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
