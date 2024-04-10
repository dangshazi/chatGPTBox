import PropTypes from 'prop-types'
import { createContext, useEffect, useReducer } from 'react';
import Browser from 'webextension-polyfill';

import { bingWebModelKeys } from '../config/index.mjs'

// hooks

// ----------------------------------------------------------------------

const defaultStates = {
  isReady: false, // Port是否准备好
  port: null,
  isResponsing: false, // background是否正在response
  unfinishedAnswer: null, // 未完成的answer
  session: {}, // 当前会话
}

const initialState = {
  ...defaultStates,
  postMessage: (msg) => {
    console.debug('postMessage:', msg)
  },
}

const createInitialState = (state) => {
  return {
    ...state,
    port: Browser.runtime.connect(),
  }
}

// 1. 先创建一个context
const PortContext = createContext(initialState)

const handlers = {
  CONNECT: (state, action) => {
    return {
      ...state,
      isReady: true,
      port: Browser.runtime.connect(),
    }
  },
  CLOSE: (state) => {
    return {
      ...state,
      isReady: false,
      port: null,
      isResponsing: false,
      unfinishedAnswer: null,
    }
  },
  // LOGOUT: (state) => ({
  //   ...state,
  //   isAuthenticated: false,
  //   user: null,
  // }),
  // REGISTER: (state, action) => {
  //   const { user } = action.payload;

  //   return {
  //     ...state,
  //     isAuthenticated: true,
  //     user,
  //   };
  // },
}

const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state

// ----------------------------------------------------------------------

PortProvider.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string,
}

// 学习provider 模式的样板
function PortProvider({ children, name }) {
  // 这里使用redux的useReducer 来处理复杂的state
  const [state, dispatch] = useReducer(reducer, defaultStates, createInitialState)
  const {port} = state;
  // `.some` for multi mode models. e.g. bingFree4-balanced
  // const useForegroundFetch = bingWebModelKeys.some((n) => state.session.modelName.includes(n))
  const useForegroundFetch = false;

  // 向background发送消息
  const postMessage = async ({ session, stop }) => {
    // if (useForegroundFetch) {
    //   foregroundMessageListeners.current.forEach((listener) => listener({ session, stop }))
    //   // 当前会话不为空，发送到bing?
    //   if (session) {
    //     const fakePort = {
    //       postMessage: (msg) => {
    //         messageListener(msg)
    //       },
    //       onMessage: {
    //         addListener: (listener) => {
    //           foregroundMessageListeners.current.push(listener)
    //         },
    //         removeListener: (listener) => {
    //           foregroundMessageListeners.current.splice(
    //             foregroundMessageListeners.current.indexOf(listener),
    //             1,
    //           )
    //         },
    //       },
    //       onDisconnect: {
    //         addListener: () => {},
    //         removeListener: () => {},
    //       },
    //     }
    //     try {
    //       const bingToken = (await getUserConfig()).bingAccessToken
    //       if (session.modelName.includes('bingFreeSydney'))
    //         await generateAnswersWithBingWebApi(
    //           fakePort,
    //           session.question,
    //           session,
    //           bingToken,
    //           true,
    //         )
    //       else await generateAnswersWithBingWebApi(fakePort, session.question, session, bingToken)
    //     } catch (err) {
    //       handlePortError(session, fakePort, err)
    //     }
    //   }
    // } else {
    //   port.postMessage({ session, stop })
    // }
  }

  // 接受来自background的消息
  const messageListener = (msg) => {
    //   // append fragment of answer when use socket
    //   if (msg.answer) {
    //     updateAnswer(msg.answer, false, 'answer')
    //   }
    //   if (msg.session) {
    //     if (msg.done) msg.session = { ...msg.session, isRetry: false }
    //     setSession(msg.session)
    //   }
    //   // append empty string
    //   if (msg.done) {
    //     updateAnswer('', true, 'answer', true)
    //     setIsReady(true)
    //   }
    //   if (msg.error) {
    //     switch (msg.error) {
    //       case 'UNAUTHORIZED':
    //         updateAnswer(
    //           `${t('UNAUTHORIZED')}<br>${t('Please login at https://chat.openai.com first')}${
    //             isSafari() ? `<br>${t('Then open https://chat.openai.com/api/auth/session')}` : ''
    //           }<br>${t('And refresh this page or type you question again')}` +
    //             `<br><br>${t(
    //               'Consider creating an api key at https://platform.openai.com/account/api-keys',
    //             )}`,
    //           false,
    //           'error',
    //         )
    //         break
    //       case 'CLOUDFLARE':
    //         updateAnswer(
    //           `${t('OpenAI Security Check Required')}<br>${
    //             isSafari()
    //               ? t('Please open https://chat.openai.com/api/auth/session')
    //               : t('Please open https://chat.openai.com')
    //           }<br>${t('And refresh this page or type you question again')}` +
    //             `<br><br>${t(
    //               'Consider creating an api key at https://platform.openai.com/account/api-keys',
    //             )}`,
    //           false,
    //           'error',
    //         )
    //         break
    //       default: {
    //         let formattedError = msg.error
    //         if (typeof msg.error === 'string' && msg.error.trimStart().startsWith('{'))
    //           try {
    //             formattedError = JSON.stringify(JSON.parse(msg.error), null, 2)
    //           } catch (e) {
    //             /* empty */
    //           }
    //         let lastItem
    //         if (conversationItemDataArray.length > 0)
    //           lastItem = conversationItemDataArray[conversationItemDataArray.length - 1]
    //         if (lastItem && (lastItem.content.includes('gpt-loading') || lastItem.type === 'error'))
    //           updateAnswer(t(formattedError), false, 'error')
    //         else
    //           setConversationItemDataArray([
    //             ...conversationItemDataArray,
    //             new ConversationItemData('error', t(formattedError)),
    //           ])
    //         break
    //       }
    //     }
    //     setIsReady(true)
    //   }
  }

  // 用于更新未完成的answer
  // const updateAnswer = (value, appended, newType, done = false) => {
  //   setConversationItemDataArray((old) => {
  //     const copy = [...old]
  //     const index = findLastIndex(copy, (v) => v.type === 'answer' || v.type === 'error')
  //     if (index === -1) return copy
  //     copy[index] = new ConversationItemData(
  //       newType,
  //       // 这里append是由接口返回的格式决定的：socket返回时为true，接口返回时为false
  //       appended ? copy[index].content + value : value,
  //     )
  //     copy[index].done = done
  //     return copy
  //   })
  // }

  // useEffect(() => {
  //   const initialize = async () => {
  //     try {
  //       dispatch({ type: 'CONNECT' })
  //       console.debug('port %s initialized', name)
  //     } catch (err) {
  //       console.error('Fail to initialize port', err)
  //     }
  //   }
  //   // 组件加载后进行初始化工作
  //   initialize()
  // }, [])

  useEffect(() => {
    const portReconnectListener = () => {
      try {
        dispatch({ type: 'CONNECT' })
        console.debug('port %s initialized', name)
      } catch (err) {
        console.error('Fail to initialize port', err)
      }
    }

    const closeChatsListener = (message) => {
      if (message.type === 'CLOSE_CHATS') {
        port.disconnect()
        dispatch({ type: 'CLOSE' })
        console.debug('port %s closed', name)
      }
    }

    if (!useForegroundFetch) {
      port.onMessage.addListener(messageListener)
    }

    // 关闭chat的命令是由backgroud发过来的
    Browser.runtime.onMessage.addListener(closeChatsListener)
    // 怀疑是backgroud休眠后discount掉了,此时需要重新连接一下
    port.onDisconnect.addListener(portReconnectListener)
    return () => {
      Browser.runtime.onMessage.removeListener(closeChatsListener)
      if (!useForegroundFetch) {
        port.onMessage.removeListener(messageListener)
      }
      port.onDisconnect.removeListener(portReconnectListener)
    }
  }, [port])

  return (
    // 2. 返回Context.Provider
    <PortContext.Provider
      value={{
        ...state,
        postMessage,
        // onMessage,
      }}
    >
      {children}
    </PortContext.Provider>
  )
}

// 3. useSettings hooks 返回 PortContext 的值
export { PortContext, PortProvider }
