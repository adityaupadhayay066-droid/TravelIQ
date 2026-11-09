/**
 * AEVORA Official Brand Configuration & Identity System
 * Unified travel intelligence and mobility platform.
 */

export const BRAND = {
  name: 'AEVORA',
  legalName: 'AEVORA Travel Technologies Inc.',
  tagline: 'A smarter way to discover the world.',
  philosophy: 'Discover. Connect. Explore.',
  positioning: 'AI-powered unified travel intelligence and mobility platform.',
  version: '2.4.0',

  colors: {
    primary: '#0B132B',         // Deep Midnight Navy
    primaryAccent: '#0284C7',   // Aerospace Sky Blue
    secondaryAccent: '#38BDF8', // Crisp Sky Highlight
    background: '#F8FAFC',      // Crisp Cloud White
    surface: '#FFFFFF',         // Pure White
    secondaryText: '#64748B',   // Slate Grey
    darkSurface: '#0F172A',     // Obsidian Slate
    borderLight: '#E2E8F0',
    borderDark: '#1E293B',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
    navyGlow: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
    surfaceGlow: 'linear-gradient(180deg, rgba(2, 132, 199, 0.05) 0%, rgba(56, 189, 248, 0.01) 100%)',
  },

  typography: {
    headingFont: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
    bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  assets: {
    logo: '/brand/aevora-logo.svg',
    logoDark: '/brand/aevora-logo-dark.svg',
    logoLight: '/brand/aevora-logo-light.svg',
    icon: '/brand/aevora-icon.svg',
    monochrome: '/brand/aevora-monochrome.svg',
    favicon: '/favicon.svg',
  },

  links: {
    supportEmail: 'support@aevora.travel',
    securityEmail: 'security@aevora.travel',
    docs: '/developer',
  },

  features: [
    {
      title: 'Intelligent Route Planning',
      description: 'Algorithmic multi-modal routing comparing rail, road, and air in real time.',
      icon: 'Route',
    },
    {
      title: 'Multi-Transport Discovery',
      description: 'Unified search across verified rail networks, airlines, and intercity buses.',
      icon: 'Compass',
    },
    {
      title: 'Smart Fare Comparison',
      description: 'Transparent fare structures with dynamic historical price analytics.',
      icon: 'TrendingDown',
    },
    {
      title: 'Personalized Travel Assistance',
      description: 'Context-aware conversational intelligence tailored to your travel preferences.',
      icon: 'Sparkles',
    },
    {
      title: 'Local Transportation Insights',
      description: 'First-to-last-mile connectivity maps, station hubs, and local transit transfers.',
      icon: 'MapPin',
    },
    {
      title: 'Real-Time Travel Information',
      description: 'Live rail delay forecasts, platform updates, and schedule notifications.',
      icon: 'Clock',
    },
  ],
};

export default BRAND;

