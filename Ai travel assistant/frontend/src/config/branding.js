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
    primary: '#101B2D',       // Midnight Navy
    primaryAccent: '#20C5D9', // Electric Cyan
    secondaryAccent: '#42D6B5', // Aurora Teal
    background: '#F4F7FB',    // Cloud White
    surface: '#FFFFFF',       // Pure White
    secondaryText: '#64748B', // Slate Grey
    darkSurface: '#101B2D',   // Dark Surface
    borderLight: '#E2E8F0',
    borderDark: '#1E293B',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #20C5D9 0%, #42D6B5 100%)',
    navyGlow: 'linear-gradient(135deg, #101B2D 0%, #1A2E4C 100%)',
    surfaceGlow: 'linear-gradient(180deg, rgba(32, 197, 217, 0.08) 0%, rgba(66, 214, 181, 0.02) 100%)',
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

