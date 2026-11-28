import { DEFAULT_CTA_LABEL, type ReferralCard, type ReferralCategory } from '../referralTypes';

const SAMPLES: Record<ReferralCategory, Pick<ReferralCard, 'brand' | 'benefitLabel' | 'title' | 'steps' | 'code'>> = {
  BANK: {
    brand: 'Mi Banco', benefitLabel: 'Bono de bienvenida de hasta', title: '$1,500 MXN', code: 'CASHI1500',
    steps: ['Abre tu cuenta con nuestro enlace.', 'Cumple con los requisitos de la promoción.', 'Recibe tu bono en tu cuenta.'],
  },
  SOFIPO: {
    brand: 'Mi SOFIPO', benefitLabel: 'Rendimiento de bienvenida', title: '$300 MXN', code: 'CASHISOFIPO',
    steps: ['Regístrate con el código de Cashi.', 'Invierte $1,000 MXN o más.', 'Recibe tu bono al mes.'],
  },
  BROKER: {
    brand: 'Mi Broker', benefitLabel: 'Bono de bienvenida de hasta', title: '$1,000 MXN', code: 'CASHI1000',
    steps: ['Abre tu cuenta con el enlace de Cashi.', 'Realiza tu primera inversión.', 'Recibe tu bono en tu cuenta.'],
  },
  FINTECH: {
    brand: 'Mi Fintech', benefitLabel: 'Recompensa por registro e inversión', title: '$200 MXN', code: 'CASHI200',
    steps: ['Abre una cuenta nueva.', 'Invierte $2,500 MXN o más.', 'Cumple el requisito durante el primer mes.'],
  },
};

// Tarjeta de ejemplo para la vista previa de una plantilla sin tarjetas
export function sampleCard(category: ReferralCategory, ctaLabel = DEFAULT_CTA_LABEL): ReferralCard {
  return {
    id: 'sample',
    templateId: null,
    category,
    categoryLabel: null,
    logoUrl: null,
    description: '',
    features: [],
    link: 'https://cashi.dev',
    ctaLabel,
    termsUrl: 'https://cashi.dev/terms',
    status: 'PUBLISHED',
    order: 0,
    updatedAt: new Date().toISOString(),
    template: null,
    ...SAMPLES[category],
  };
}
