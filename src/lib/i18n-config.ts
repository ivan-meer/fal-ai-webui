export const defaultNS = 'common';
export const fallbackLng = 'en';
export const languages = [fallbackLng, 'ja'];

export function getOptions(lng = fallbackLng, ns: string | string[] = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  };
} 