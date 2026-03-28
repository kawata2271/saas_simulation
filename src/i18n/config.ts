/**
 * i18n設定
 * react-i18nextの初期化設定
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ja from './locales/ja/translation.json'
import en from './locales/en/translation.json'

const resources = {
  ja: { translation: ja },
  en: { translation: en },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: 'ja',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
}).catch((err: unknown) => {
  console.error('[i18n] Init failed:', err)
})

export default i18n
