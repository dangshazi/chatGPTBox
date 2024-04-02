import Browser from 'webextension-polyfill'
import '../_locales/i18n'
import {
  azureOpenAiApiModelKeys,
  bardWebModelKeys,
  bingWebModelKeys,
  chatglmApiModelKeys,
  chatgptApiModelKeys,
  chatgptWebModelKeys,
  claudeApiModelKeys,
  claudeWebModelKeys,
  customApiModelKeys,
  defaultConfig,
  getUserConfig,
  githubThirdPartyApiModelKeys,
  gptApiModelKeys,
  moonshotApiModelKeys,
  moonshotWebModelKeys,
  poeWebModelKeys,
  setUserConfig,
} from '../config/index.mjs'
import { generateAnswersWithAzureOpenaiApi } from '../services/apis/azure-openai-api.mjs'
import { generateAnswersWithBardWebApi } from '../services/apis/bard-web.mjs'
import { generateAnswersWithBingWebApi } from '../services/apis/bing-web.mjs'
import { generateAnswersWithChatGLMApi } from '../services/apis/chatglm-api.mjs'
import {
  deleteConversation,
  generateAnswersWithChatgptWebApi,
  sendMessageFeedback,
} from '../services/apis/chatgpt-web'
import { generateAnswersWithClaudeApi } from '../services/apis/claude-api.mjs'
import { generateAnswersWithClaudeWebApi } from '../services/apis/claude-web.mjs'
import { generateAnswersWithCustomApi } from '../services/apis/custom-api.mjs'
import { generateAnswersWithMoonshotCompletionApi } from '../services/apis/moonshot-api.mjs'
import { generateAnswersWithMoonshotWebApi } from '../services/apis/moonshot-web.mjs'
import {
  generateAnswersWithChatgptApi,
  generateAnswersWithGptCompletionApi,
} from '../services/apis/openai-api'
import { generateAnswersWithWaylaidwandererApi } from '../services/apis/waylaidwanderer-api.mjs'

import {
  getBardCookies,
  getBingAccessToken,
  getChatGptAccessToken,
  getClaudeSessionKey,
  registerPortListener,
} from '../services/wrappers.mjs'
import { isChrome } from '../utils/is-chrome.mjs'
import { openUrl } from '../utils/open-url.mjs'
import { registerCommands } from './commands.mjs'
import { refreshMenu } from './menus.mjs'

if (isChrome()) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error))
}

function setPortProxy(port, proxyTabId) {
  // set proxy for port
  port.proxy = Browser.tabs.connect(proxyTabId)
  // chatgpt page 发送过来的消息转发给proxy
  const proxyOnMessage = (msg) => {
    port.postMessage(msg)
  }
  const portOnMessage = (msg) => {
    port.proxy.postMessage(msg)
  }
  // 与chatgpt page链接断了之后要重新连
  const proxyOnDisconnect = () => {
    port.proxy = Browser.tabs.connect(proxyTabId)
  }
  // port的链接断了之后也没必要维持与chatgpt page的链接
  const portOnDisconnect = () => {
    port.proxy.onMessage.removeListener(proxyOnMessage)
    port.onMessage.removeListener(portOnMessage)
    port.proxy.onDisconnect.removeListener(proxyOnDisconnect)
    port.onDisconnect.removeListener(portOnDisconnect)
  }
  port.proxy.onMessage.addListener(proxyOnMessage)
  port.onMessage.addListener(portOnMessage)
  port.proxy.onDisconnect.addListener(proxyOnDisconnect)
  port.onDisconnect.addListener(portOnDisconnect)
}

async function executeApi(session, port, config) {
  console.debug('modelName', session.modelName)

  // 1. chatgpt-web
  // port发来的所有消息本质上都被转发给了chatgpt页面
  if (chatgptWebModelKeys.includes(session.modelName)) {
    let tabId
    if (
      config.chatgptTabId &&
      config.customChatGptWebApiUrl === defaultConfig.customChatGptWebApiUrl
    ) {
      const tab = await Browser.tabs.get(config.chatgptTabId).catch(() => {})
      if (tab) tabId = tab.id
    }
    // 如果能找到chatgptTabId就用chatgptTabId
    if (tabId) {
      if (!port.proxy) {
        setPortProxy(port, tabId)
        port.proxy.postMessage({ session })
      }
    } else {
      // 如果找不到chatgptTabId就用cookie中的accessToken
      const accessToken = await getChatGptAccessToken()
      await generateAnswersWithChatgptWebApi(port, session.question, session, accessToken)
    }
  } else if (
    // 2. bing-web
    // `.some` for multi mode models. e.g. bingFree4-balanced
    bingWebModelKeys.some((n) => session.modelName.includes(n))
  ) {
    const accessToken = await getBingAccessToken()
    if (session.modelName.includes('bingFreeSydney'))
      await generateAnswersWithBingWebApi(port, session.question, session, accessToken, true)
    else await generateAnswersWithBingWebApi(port, session.question, session, accessToken)
  } else if (gptApiModelKeys.includes(session.modelName)) {
    // 3. gpt-api 应该是老版的几个模型
    await generateAnswersWithGptCompletionApi(
      port,
      session.question,
      session,
      config.apiKey,
      session.modelName,
    )
  } else if (chatgptApiModelKeys.includes(session.modelName)) {
    // 4. chatgpt-api 这个理解起来最简单
    await generateAnswersWithChatgptApi(
      port,
      session.question,
      session,
      config.apiKey,
      session.modelName,
    )
  } else if (customApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithCustomApi(
      port,
      session.question,
      session,
      config.customApiKey,
      config.customModelName,
    )
  } else if (azureOpenAiApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithAzureOpenaiApi(port, session.question, session)
  } else if (claudeApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithClaudeApi(port, session.question, session)
  } else if (chatglmApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithChatGLMApi(port, session.question, session, session.modelName)
  } else if (githubThirdPartyApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithWaylaidwandererApi(port, session.question, session)
  } else if (poeWebModelKeys.includes(session.modelName)) {
    throw new Error('Due to the new verification, Poe Web API is currently not supported.')
    // if (session.modelName === 'poeAiWebCustom')
    //   await generateAnswersWithPoeWebApi(port, session.question, session, config.poeCustomBotName)
    // else
    //   await generateAnswersWithPoeWebApi(
    //     port,
    //     session.question,
    //     session,
    //     Models[session.modelName].value,
    //   )
  } else if (bardWebModelKeys.includes(session.modelName)) {
    const cookies = await getBardCookies()
    await generateAnswersWithBardWebApi(port, session.question, session, cookies)
  } else if (claudeWebModelKeys.includes(session.modelName)) {
    const sessionKey = await getClaudeSessionKey()
    await generateAnswersWithClaudeWebApi(
      port,
      session.question,
      session,
      sessionKey,
      session.modelName,
    )
  } else if (moonshotApiModelKeys.includes(session.modelName)) {
    await generateAnswersWithMoonshotCompletionApi(
      port,
      session.question,
      session,
      config.moonshotApiKey,
      session.modelName,
    )
  } else if (moonshotWebModelKeys.includes(session.modelName)) {
    await generateAnswersWithMoonshotWebApi(
      port,
      session.question,
      session,
      config,
      session.modelName,
    )
  }
}

// 传递消息的主要处理逻辑 ：监听来自其他上下文（如内容脚本或弹出窗口）发送的消息
// 这里的消息是临时的内容，用来传递动作/操作给background
Browser.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.type) {
    case 'FEEDBACK': {
      const token = await getChatGptAccessToken()
      await sendMessageFeedback(token, message.data)
      break
    }
    case 'DELETE_CONVERSATION': {
      const token = await getChatGptAccessToken()
      await deleteConversation(token, message.data.conversationId)
      break
    }
    case 'NEW_URL': {
      const newTab = await Browser.tabs.create({
        url: message.data.url,
        pinned: message.data.pinned,
      })
      if (message.data.saveAsChatgptConfig) {
        await setUserConfig({
          chatgptTabId: newTab.id,
          chatgptJumpBackTabId: sender.tab.id,
        })
      }
      break
    }
    case 'SET_CHATGPT_TAB': {
      await setUserConfig({
        chatgptTabId: sender.tab.id,
      })
      break
    }
    case 'ACTIVATE_URL':
      await Browser.tabs.update(message.data.tabId, { active: true })
      break
    case 'OPEN_URL':
      openUrl(message.data.url)
      break
    case 'OPEN_CHAT_WINDOW': {
      const config = await getUserConfig()
      const url = Browser.runtime.getURL('IndependentPanel.html')
      const tabs = await Browser.tabs.query({ url: url, windowType: 'popup' })
      if (!config.alwaysCreateNewConversationWindow && tabs.length > 0)
        await Browser.windows.update(tabs[0].windowId, { focused: true })
      else
        await Browser.windows.create({
          url: url,
          type: 'popup',
          width: 500,
          height: 650,
        })
      break
    }
    case 'REFRESH_MENU':
      refreshMenu()
      break
    case 'PIN_TAB': {
      // Tab pin是为了讲chatBox的tab pin下来
      let tabId
      if (message.data.tabId) tabId = message.data.tabId
      else tabId = sender.tab.id

      await Browser.tabs.update(tabId, { pinned: true })
      if (message.data.saveAsChatgptConfig) {
        await setUserConfig({ chatgptTabId: tabId })
      }
      break
    }
    case 'FETCH': {
      if (message.data.input.includes('bing.com')) {
        const accessToken = await getBingAccessToken()
        await setUserConfig({ bingAccessToken: accessToken })
      }

      try {
        const response = await fetch(message.data.input, message.data.init)
        const text = await response.text()
        return [
          {
            body: text,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers),
          },
          null,
        ]
      } catch (error) {
        return [null, error]
      }
    }
  }
})

try {
  // open-ai related:获取arkose的req url和form
  Browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (
        details.url.includes('/public_key') &&
        !details.url.includes(defaultConfig.chatgptArkoseReqParams)
      ) {
        let formData = new URLSearchParams()
        for (const k in details.requestBody.formData) {
          formData.append(k, details.requestBody.formData[k])
        }
        setUserConfig({
          chatgptArkoseReqUrl: details.url,
          chatgptArkoseReqForm:
            formData.toString() ||
            new TextDecoder('utf-8').decode(new Uint8Array(details.requestBody.raw[0].bytes)),
        }).then(() => {
          console.log('Arkose req url and form saved')
        })
      }
    },
    {
      urls: ['https://*.openai.com/*', 'https://*.chatgpt.com/*'],
      types: ['xmlhttprequest'],
    },
    ['requestBody'],
  )

  // bing: refactor headers
  Browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const headers = details.requestHeaders
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].name === 'Origin') {
          headers[i].value = 'https://www.bing.com'
        } else if (headers[i].name === 'Referer') {
          headers[i].value = 'https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx'
        }
      }
      return { requestHeaders: headers }
    },
    {
      urls: ['wss://sydney.bing.com/*', 'https://www.bing.com/*'],
      types: ['xmlhttprequest', 'websocket'],
    },
    ['requestHeaders'],
  )

  // side panel
  Browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return
    // eslint-disable-next-line no-undef
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'chatpage.html',
      enabled: true,
    })
  })
} catch (error) {
  console.log(error)
}

//注意：这里的链接是持久链接，用于传输对话内容
registerPortListener(async (session, port, config) => await executeApi(session, port, config))
registerCommands()
refreshMenu()
