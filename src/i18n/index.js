import en from './en.js'
import gu from './gu.js'

export const dictionaries = { en, gu }
export const languageNames = { en: 'English', gu: 'ગુજરાતી' }

// Interpolates {name} placeholders and falls back to English for missing keys.
export function translate(language, key, params = {}) {
  const dictionary = dictionaries[language] || en
  const template = dictionary[key] ?? en[key] ?? key
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] === undefined ? match : String(params[name]),
  )
}
