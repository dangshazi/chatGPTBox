import { changeLanguage, t } from 'i18next'
import Browser from 'webextension-polyfill'
import { defaultConfig, getPreferredLanguageKey } from '../config/index.mjs'
import { config as menuConfig } from '../content-script/menu-tools/index.mjs'

// 目前看只在backgroud加载的时候运行一次
export function refreshMenu() {
  Browser.contextMenus.removeAll().then(async () => {
    await getPreferredLanguageKey().then((lang) => {
      changeLanguage(lang)
    })
    const menuId = 'ChatGPTBox-Menu'

    //这里的contextMenus分两部分
    //contexts 属性用于定义上下文菜单项将在哪些类型的页面上可用
    // 1. 右键的contextMenus: contexts: ['all']
    Browser.contextMenus.create({
      id: menuId,
      title: 'ChatGPTBox',
      contexts: ['all'],
    })

    for (const [k, v] of Object.entries(menuConfig)) {
      Browser.contextMenus.create({
        id: menuId + k,
        parentId: menuId,
        title: t(v.label),
        contexts: ['all'],
      })
    }
    // 2. 选中的contextMenus ：selectionTool contexts: ['selection']
    Browser.contextMenus.create({
      id: menuId + 'separator1',
      parentId: menuId,
      contexts: ['selection'],
      type: 'separator', //注意这里的type
    })
    for (const index in defaultConfig.selectionTools) {
      const key = defaultConfig.selectionTools[index]
      const desc = defaultConfig.selectionToolsDesc[index]
      Browser.contextMenus.create({
        id: menuId + key,
        parentId: menuId,
        title: t(desc),
        contexts: ['selection'],
      })
    }

    // 为context Menu设置点击事件
    Browser.contextMenus.onClicked.addListener((info, tab) => {
      Browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const currentTab = tabs[0]
        const message = {
          itemId: info.menuItemId.replace(menuId, ''),
          selectionText: info.selectionText,
          useMenuPosition: tab.id === currentTab.id,
        }
        console.debug('menu clicked', message)

        if (defaultConfig.selectionTools.includes(message.itemId)) {
          Browser.tabs.sendMessage(currentTab.id, {
            type: 'CREATE_CHAT',
            data: message,
          })
        } else if (message.itemId in menuConfig) {
          //常见的几个menu item触发action
          if (menuConfig[message.itemId].action) {
            menuConfig[message.itemId].action(true, tab)
          }

          if (menuConfig[message.itemId].genPrompt) {
            Browser.tabs.sendMessage(currentTab.id, {
              type: 'CREATE_CHAT',
              data: message,
            })
          }
        }
      })
    })
  })
}
