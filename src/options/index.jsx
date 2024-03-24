import { changeLanguage } from 'i18next'
import { render } from 'preact'
import Browser from 'webextension-polyfill'
import '../_locales/i18n-react'
import { getPreferredLanguageKey } from '../config/index.mjs'
import Settings from './Settings'

document.body.style.margin = 0
document.body.style.overflow = 'hidden'
getPreferredLanguageKey().then((lang) => {
  changeLanguage(lang)
})
Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'CHANGE_LANG') {
    const data = message.data
    changeLanguage(data.lang)
  }
})
render(<Settings />, document.getElementById('app'))
