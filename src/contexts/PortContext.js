import PropTypes from 'prop-types'
import { createContext, useEffect, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Browser from 'webextension-polyfill'

import { bingWebModelKeys, getUserConfig } from '../config/index.mjs'
import { generateAnswersWithBingWebApi } from '../services/apis/bing-web.mjs'
import { initSession } from '../services/init-session.mjs'
import { handlePortError } from '../services/wrappers.mjs'
import { isSafari } from '../utils'

import { useDispatch, useSelector } from '../../redux/store'
// utils
import uuidv4 from '../utils/uuidv4'
// redux
import {
  onUpdateMessage
} from '../../redux/slices/chat';

// hooks

// ----------------------------------------------------------------------

const conversationState = {
  isReady: false, // Port是否准备好
  port: null,
  isResponsing: false, // background是否正在response
  // answerType: null,
  // error: null,
  // unfinishedAnswer: null, // 未完成的answer
  currentMessageId: null,
  session: {}, // 当前会话
}

const initialState = {
  ...conversationState,
  postMessage: (msg) => {
    console.debug('postMessage:', msg)
  },
}

// 1. 先创建一个context
const PortContext = createContext(initialState)
const WAITING_RESPONSE = `Waiting for response...`

const handlers = {
  CONNECT: (state, action) => {
    const { conversationId } = action.payload
    const port = Browser.runtime.connect()
    port.conversationId = conversationId

    return {
      ...state,
      isReady: true,
      session: initSession(),
      // answerType: 'answer',
      port,
    }
  },

  POST_MSG: (state, action) => {
    const { session } = action.payload

    return {
      ...state,
      isResponsing: true,
      session: session,
      // error: null,
      // unfinishedAnswer: WAITING_RESPONSE,
      // answerType: 'answer',
      currentMessageId: uuidv4(),
    }
  },
  // UPDATE_ANSWER: (state, action) => {
  //   const { unfinishedAnswer, answerType } = action.payload

  //   return {
  //     ...state,
  //     error: null,
  //     unfinishedAnswer,
  //     answerType,
  //   }
  // },

  // REPORT_ERROR: (state, action) => {
  //   const { error, answerType } = action.payload

  //   const answer =
  //     WAITING_RESPONSE === state.unfinishedAnswer ? 'Fail to get answer' : state.unfinishedAnswer

  //   return {
  //     ...state,
  //     unfinishedAnswer: answer,
  //     error,
  //     answerType,
  //   }
  // },

  RESPONSE_DONE: (state) => {
    return {
      ...state,
      isResponsing: false,
    }
  },

  UPDATE_SESSION: (state, action) => {
    const { session } = action.payload
    return {
      ...state,
      session,
    }
  },

  CLOSE: (state) => {
    if (state.port) {
      state.port.disconnect()
    }
    return {
      ...state,
      isReady: false,
      port: null,
      // error: null,
      isResponsing: false,
      // unfinishedAnswer: null,
    }
  },
}

const reducer = (state, action) => {
  const { conversationId } = action.payload

  const currentState = conversationId ? state[conversationId] : initialState
  const updatedState = handlers[action.type]
    ? handlers[action.type](currentState, action)
    : currentState

  return {
    ...state,
    [conversationId]: updatedState,
  }
}

// ----------------------------------------------------------------------

PortProvider.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string,
}

// 学习provider 模式的样板
/**
 * 负责将background的回复的消息传递给redux存储，并给ChatMessageFrame提供postMessage方法
 * @param {*} param0 
 * @returns 
 */
function PortProvider({ children, name }) {
  const { t } = useTranslation()
  const reduxDispatch = useDispatch()

  // Get active conversation
  const { activeConversationId } = useSelector((chatState) => chatState.chat)

  // 这里使用redux的useReducer 来处理复杂的state
  const [state, dispatch] = useReducer(reducer, {})
  const currentConversationState = state[activeConversationId] || conversationState
  const { port, session } = currentConversationState
  // `.some` for multi mode models. e.g. bingFree4-balanced
  const useForegroundFetch = bingWebModelKeys.some((n) =>
    currentConversationState?.session?.modelName?.includes(n),
  )

  const foregroundMessageListeners = useRef([])

  const updateMessageInStore = (payload) => {
    const curentState = state[activeConversationId] || conversationState
    const updatedCurrentConversationState = {
      ...curentState,
      ...payload,
    }
    const {
      conversationId,
      unfinishedAnswer,
      error,
      answerType,
      currentMessageId,
    } = updatedCurrentConversationState
    if (answerType === 'answer' && unfinishedAnswer != null) {
      dispatch(
        onUpdateMessage({
          conversationId,
          messageId: currentMessageId,
          message: unfinishedAnswer,
          contentType: 'text',
          attachments: [],
          createdAt: new Date(),
          senderId: oneParticipant.id,
        }),
      )
    }

    if (answerType === 'error' && error != null) {
      dispatch(
        onUpdateMessage({
          conversationId,
          messageId: currentMessageId,
          message: unfinishedAnswer,
          error: error,
          contentType: 'text',
          attachments: [],
          createdAt: new Date(),
          senderId: oneParticipant.id,
        }),
      )
    }
  }

  // 向background发送消息
  const postMessageBySession = async ({ session, stop }) => {
    if (useForegroundFetch) {
      foregroundMessageListeners.current.forEach((listener) => listener({ session, stop }))
      // 当前会话不为空，发送到bing?
      if (session) {
        const fakePort = {
          postMessage: (msg) => {
            messageListener(msg)
          },
          onMessage: {
            addListener: (listener) => {
              foregroundMessageListeners.current.push(listener)
            },
            removeListener: (listener) => {
              foregroundMessageListeners.current.splice(
                foregroundMessageListeners.current.indexOf(listener),
                1,
              )
            },
          },
          onDisconnect: {
            addListener: () => {},
            removeListener: () => {},
          },
        }
        try {
          const bingToken = (await getUserConfig()).bingAccessToken
          if (session.modelName.includes('bingFreeSydney'))
            await generateAnswersWithBingWebApi(
              fakePort,
              session.question,
              session,
              bingToken,
              true,
            )
          else await generateAnswersWithBingWebApi(fakePort, session.question, session, bingToken)
        } catch (err) {
          handlePortError(session, fakePort, err)
        }
      }
    } else {
      if (port) {
        port.postMessage({ session, stop })
        console.debug('Posted message')
      } else {
        console.error('Fail to post message, port is null')
      }
    }
  }

  // 这个方法是给ChatMessageFrame用的,所以不需要存储到redux，ChatMessageFrame会自己去存储
  const postMessage = async (minimalMsg) => {
    // Transform minimal message to question
    // minimal message example:
    //   {
    //     "conversationId": "e99f09a7-dd88-49d5-b1c8-1daf80c2d7b2",
    //     "messageId": "14735d82-a340-4172-b6c0-9f7cec150d84",
    //     "message": "1+1\\n",
    //     "contentType": "text",
    //     "attachments": [],
    //     "createdAt": "2024-04-12T07:15:22.244Z",
    //     "senderId": "8864c717-587d-472a-929a-8e5f298024da-0"
    // }
    const question = minimalMsg.message
    const newSession = { ...session, question, isRetry: false }
    postMessageBySession({ session: newSession })
    // 更新State
    dispatch({
      type: 'POST_MSG',
      payload: { conversationId: activeConversationId, session: newSession },
    })
  }

  // 接受来自background的消息
  const messageListener = (msg, sender) => {
    // append fragment of answer when use socket
    if (msg.answer) {
      console.debug('answer:', msg.answer)
      const payload = {
        conversationId: sender.conversationId,
        unfinishedAnswer: msg.answer,
        error: null,
        answerType: 'answer',
      }
      // dispatch({
      //   type: 'UPDATE_ANSWER',
      //   payload,
      // })
      updateMessageInStore(payload)
    }
    if (msg.session) {
      if (msg.done) msg.session = { ...msg.session, isRetry: false }
      dispatch({
        type: 'UPDATE_SESSION',
        payload: { conversationId: sender.conversationId, session: msg.session },
      })
    }
    // append empty string
    if (msg.done) {
      dispatch({ type: 'RESPONSE_DONE', payload: { conversationId: sender.conversationId } })
    }
    if (msg.error) {
      const payload = {}
      switch (msg.error) {
        case 'UNAUTHORIZED':
          payload = {
            conversationId: sender.conversationId,
            error:
              `${t('UNAUTHORIZED')}<br>${t('Please login at https://chat.openai.com first')}${isSafari() ? `<br>${t('Then open https://chat.openai.com/api/auth/session')}` : ''
              }<br>${t('And refresh this page or type you question again')}` +
              `<br><br>${t(
                'Consider creating an api key at https://platform.openai.com/account/api-keys',
              )}`,
            answerType: 'error',
          }
          break
        case 'CLOUDFLARE':
          payload = {
            conversationId: sender.conversationId,
            error:
              `${t('OpenAI Security Check Required')}<br>${isSafari()
                ? t('Please open https://chat.openai.com/api/auth/session')
                : t('Please open https://chat.openai.com')
              }<br>${t('And refresh this page or type you question again')}` +
              `<br><br>${t(
                'Consider creating an api key at https://platform.openai.com/account/api-keys',
              )}`,
            answerType: 'error',
          }
          break
        default: {
          let formattedError = msg.error
          if (typeof msg.error === 'string' && msg.error.trimStart().startsWith('{'))
            try {
              formattedError = JSON.stringify(JSON.parse(msg.error), null, 2)
            } catch (e) {
              /* empty */
              console.error('JSON parse error', e)
            }
          payload = {
            conversationId: sender.conversationId,
            error: t(formattedError),
            answerType: 'error',
          }
          break
        }
      }
      // dispatch({ type: 'REPORT_ERROR', payload: payload })
      updateMessageInStore(payload)
      dispatch({ type: 'RESPONSE_DONE', payload: { conversationId: sender.conversationId } })
    }
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!state[activeConversationId] || !state[activeConversationId].port) {
          dispatch({ type: 'CONNECT', payload: { conversationId: activeConversationId } })
        }
        console.debug('port[%s] initialized', activeConversationId)
      } catch (err) {
        console.error('Fail to initialize port', err)
      }
    }
    // 组件加载后进行初始化工作
    initialize()
  }, [activeConversationId])

  useEffect(() => {
    console.log('PortContext initializing:', name)
    const closeChatsListener = (message) => {
      if (message.type === 'CLOSE_CHATS') {
        Object.values(state).forEach((singleState) => {
          singleState?.port?.onMessage.removeListener(messageListener)
        })

        // dispatch({ type: 'CLOSE' })
        // console.debug('port %s closed', name)
      }
    }

    // 关闭chat的命令是由backgroud发过来的
    Browser.runtime.onMessage.addListener(closeChatsListener)
    return () => {
      Browser.runtime.onMessage.removeListener(closeChatsListener)
    }
  }, [])

  useEffect(() => {
    const portReconnectListener = (oldPort) => {
      console.debug('port[%s] disconnected', oldPort.conversationId)
      if (oldPort.error) {
        console.error(`Disconnected due to an error: ${oldPort.error.message}`)
      }
      try {
        dispatch({ type: 'CONNECT', payload: { conversationId: oldPort.conversationId } })
        console.debug('port[%s] initialized', oldPort.conversationId)
      } catch (err) {
        console.error('Fail to initialize port', err)
      }
    }

    if (!useForegroundFetch) {
      port?.onMessage.addListener(messageListener)
    }
    // 怀疑是backgroud休眠后discount掉了,此时需要重新连接一下
    port?.onDisconnect.addListener(portReconnectListener)
    return () => {
      // if (!useForegroundFetch) {
      //   port.onMessage.removeListener(messageListener)
      // }
      port?.onDisconnect.removeListener(portReconnectListener)
    }
  }, [port])

  return (
    // 2. 返回Context.Provider
    <PortContext.Provider
      value={{
        ...currentConversationState,
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
