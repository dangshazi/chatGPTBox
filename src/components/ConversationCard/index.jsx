import {
  ArchiveIcon,
  DesktopDownloadIcon,
  LinkExternalIcon,
  MoveToBottomIcon,
} from '@primer/octicons-react'
import FileSaver from 'file-saver'
import { findLastIndex } from 'lodash-es'
import { render } from 'preact'
import PropTypes from 'prop-types'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Pin, WindowDesktop, XLg } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import Browser from 'webextension-polyfill'
import { ModelMode, Models, bingWebModelKeys, getUserConfig } from '../../config/index.mjs'
import { useClampWindowSize } from '../../hooks/use-clamp-window-size'
import { useConfig } from '../../hooks/use-config.mjs'
import { generateAnswersWithBingWebApi } from '../../services/apis/bing-web.mjs'
import { initSession } from '../../services/init-session.mjs'
import { createSession } from '../../services/local-session.mjs'
import { handlePortError } from '../../services/wrappers.mjs'
import { createElementAtPosition, isFirefox, isMobile, isSafari } from '../../utils'
import ConversationItem from '../ConversationItem'
import DeleteButton from '../DeleteButton'
import FloatingToolbar from '../FloatingToolbar'
import InputBox from '../InputBox'

const logo = Browser.runtime.getURL('logo.png')

class ConversationItemData extends Object {
  /**
   * @param {'question'|'answer'|'error'} type
   * @param {string} content
   * @param {bool} done
   */
  constructor(type, content, done = false) {
    super()
    this.type = type
    this.content = content
    this.done = done
  }
}

function ConversationCard(props) {
  const { t } = useTranslation()
  // 用于标识当前的answer是否完整
  const [isReady, setIsReady] = useState(!props.question)
  // content-script connect to background
  const [port, setPort] = useState(() => Browser.runtime.connect())
  const [session, setSession] = useState(props.session)
  const windowSize = useClampWindowSize([750, 1500], [250, 1100])
  const bodyRef = useRef(null)
  const [completeDraggable, setCompleteDraggable] = useState(false)
  // `.some` for multi mode models. e.g. bingFree4-balanced
  const useForegroundFetch = bingWebModelKeys.some((n) => session.modelName.includes(n))

  /**
   * @type {[ConversationItemData[], (conversationItemData: ConversationItemData[]) => void]}
   */
  const [conversationItemDataArray, setConversationItemDataArray] = useState(
    (() => {
      // 从session初始化conversationItemData
      if (session.conversationRecords.length === 0)
        if (props.question)
          return [
            new ConversationItemData(
              'answer',
              `<p class="gpt-loading">${t(`Waiting for response...`)}</p>`,
            ),
          ]
        else return []
      else {
        const ret = []
        for (const record of session.conversationRecords) {
          // 这里是一条隔着一条，并没有标注来源
          ret.push(new ConversationItemData('question', record.question, true))
          ret.push(new ConversationItemData('answer', record.answer, true))
        }
        return ret
      }
    })(),
  )
  const config = useConfig()

  useEffect(() => {
    setCompleteDraggable(!isSafari() && !isFirefox() && !isMobile())
  }, [])

  // props.onUpdate用来updatePosition
  useEffect(() => {
    if (props.onUpdate) props.onUpdate(port, session, conversationItemDataArray)
  }, [session, conversationItemDataArray])

  // 更新UI的逻辑
  useEffect(() => {
    const { offsetHeight, scrollHeight, scrollTop } = bodyRef.current
    if (
      config.lockWhenAnswer &&
      scrollHeight <= scrollTop + offsetHeight + config.answerScrollMargin
    ) {
      bodyRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'instant',
      })
    }
  }, [conversationItemDataArray])

  useEffect(async () => {
    // when the page is responsive, session may accumulate redundant data and needs to be cleared after remounting and before making a new request
    if (props.question) {
      const newSession = initSession({ ...session, question: props.question })
      setSession(newSession)
      await postMessage({ session: newSession })
    }
  }, [props.question]) // usually only triggered once

  /**
   * 用于更新未完成的answer
   * @param {string} value
   * @param {boolean} appended
   * @param {'question'|'answer'|'error'} newType
   * @param {boolean} done
   */
  const updateAnswer = (value, appended, newType, done = false) => {
    setConversationItemDataArray((old) => {
      const copy = [...old]
      const index = findLastIndex(copy, (v) => v.type === 'answer' || v.type === 'error')
      if (index === -1) return copy
      copy[index] = new ConversationItemData(
        newType,
        // 这里append是由接口返回的格式决定的：socket返回时为true，接口返回时为false
        appended ? copy[index].content + value : value,
      )
      copy[index].done = done
      return copy
    })
  }

  // current page process message from background
  const portMessageListener = (msg) => {
    // append fragment of answer when use socket
    if (msg.answer) {
      updateAnswer(msg.answer, false, 'answer')
    }
    if (msg.session) {
      if (msg.done) msg.session = { ...msg.session, isRetry: false }
      setSession(msg.session)
    }
    // append empty string
    if (msg.done) {
      updateAnswer('', true, 'answer', true)
      setIsReady(true)
    }
    if (msg.error) {
      switch (msg.error) {
        case 'UNAUTHORIZED':
          updateAnswer(
            `${t('UNAUTHORIZED')}<br>${t('Please login at https://chatgpt.com first')}${
              isSafari() ? `<br>${t('Then open https://chatgpt.com/api/auth/session')}` : ''
            }<br>${t('And refresh this page or type you question again')}` +
              `<br><br>${t(
                'Consider creating an api key at https://platform.openai.com/account/api-keys',
              )}`,
            false,
            'error',
          )
          break
        case 'CLOUDFLARE':
          updateAnswer(
            `${t('OpenAI Security Check Required')}<br>${
              isSafari()
                ? t('Please open https://chatgpt.com/api/auth/session')
                : t('Please open https://chatgpt.com')
            }<br>${t('And refresh this page or type you question again')}` +
              `<br><br>${t(
                'Consider creating an api key at https://platform.openai.com/account/api-keys',
              )}`,
            false,
            'error',
          )
          break
        default: {
          let formattedError = msg.error
          if (typeof msg.error === 'string' && msg.error.trimStart().startsWith('{'))
            try {
              formattedError = JSON.stringify(JSON.parse(msg.error), null, 2)
            } catch (e) {
              /* empty */
            }

          let lastItem
          if (conversationItemDataArray.length > 0)
            lastItem = conversationItemDataArray[conversationItemDataArray.length - 1]
          if (lastItem && (lastItem.content.includes('gpt-loading') || lastItem.type === 'error'))
            updateAnswer(t(formattedError), false, 'error')
          else
            setConversationItemDataArray([
              ...conversationItemDataArray,
              new ConversationItemData('error', t(formattedError)),
            ])
          break
        }
      }
      setIsReady(true)
    }
  }

  const foregroundMessageListeners = useRef([])

  /**
   * 用来给background发消息的逻辑
   * @param {Session|undefined} session
   * @param {boolean|undefined} stop
   */
  const postMessage = async ({ session, stop }) => {
    if (useForegroundFetch) {
      foregroundMessageListeners.current.forEach((listener) => listener({ session, stop }))
      // 当前会话不为空，发送到bing?
      if (session) {
        const fakePort = {
          postMessage: (msg) => {
            portMessageListener(msg)
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
      port.postMessage({ session, stop })
    }
  }

  useEffect(() => {
    const portListener = () => {
      setPort(Browser.runtime.connect())
      setIsReady(true)
    }

    const closeChatsListener = (message) => {
      if (message.type === 'CLOSE_CHATS') {
        port.disconnect()
        if (props.onClose) props.onClose()
      }
    }

    // 关闭chat的命令是由backgroud发过来的
    if (props.closeable) Browser.runtime.onMessage.addListener(closeChatsListener)
    port.onDisconnect.addListener(portListener)
    return () => {
      if (props.closeable) Browser.runtime.onMessage.removeListener(closeChatsListener)
      port.onDisconnect.removeListener(portListener)
    }
  }, [port])

  // 只有用户在每次提交新的问题的时候才会变动conversationItemDataArray
  useEffect(() => {
    if (useForegroundFetch) {
      return () => {}
    } else {
      port.onMessage.addListener(portMessageListener)
      return () => {
        port.onMessage.removeListener(portMessageListener)
      }
    }
  }, [conversationItemDataArray])

  // 更换model后的重试
  const getRetryFn = (session) => async () => {
    updateAnswer(`<p class="gpt-loading">${t('Waiting for response...')}</p>`, false, 'answer')
    setIsReady(false)

    if (session.conversationRecords.length > 0) {
      const lastRecord = session.conversationRecords[session.conversationRecords.length - 1]
      if (
        conversationItemDataArray[conversationItemDataArray.length - 1].done &&
        conversationItemDataArray.length > 1 &&
        lastRecord.question ===
          conversationItemDataArray[conversationItemDataArray.length - 2].content
      ) {
        session.conversationRecords.pop()
      }
    }
    const newSession = { ...session, isRetry: true }
    setSession(newSession)
    try {
      await postMessage({ stop: true })
      await postMessage({ session: newSession })
    } catch (e) {
      updateAnswer(e, false, 'error')
    }
  }

  const retryFn = useMemo(() => getRetryFn(session), [session])

  return (
    <div className="gpt-inner">
      <div
        className={
          props.draggable ? `gpt-header${completeDraggable ? ' draggable' : ''}` : 'gpt-header'
        }
        style="user-select:none;"
      >
        <span
          className="gpt-util-group"
          style={{
            padding: '15px 0 15px 15px',
            ...(props.notClampSize ? {} : { flexGrow: isSafari() ? 0 : 1 }),
            ...(isSafari() ? { maxWidth: '200px' } : {}),
          }}
        >
          {/* floatingTool close icon */}
          {props.closeable ? (
            <XLg
              className="gpt-util-icon"
              title={t('Close the Window')}
              size={16}
              onClick={() => {
                port.disconnect()
                if (props.onClose) props.onClose()
              }}
            />
          ) : props.dockable ? (
            //  没找到pin的用途
            <Pin
              className="gpt-util-icon"
              title={t('Pin the Window')}
              size={16}
              onClick={() => {
                if (props.onDock) props.onDock()
              }}
            />
          ) : (
            // independent panel中的图标
            <img src={logo} style="user-select:none;width:20px;height:20px;" />
          )}
          <select
            style={props.notClampSize ? {} : { width: 0, flexGrow: 1 }}
            className="normal-button"
            required
            onChange={(e) => {
              const modelName = e.target.value
              // 创建新的session
              const newSession = { ...session, modelName, aiName: Models[modelName].desc }
              // 切换模型重新回答
              if (config.autoRegenAfterSwitchModel && conversationItemDataArray.length > 0)
                getRetryFn(newSession)()
              else setSession(newSession)
            }}
          >
            {/* 选择使用的模型 */}
            {config.activeApiModes.map((modelName) => {
              let desc
              if (modelName.includes('-')) {
                const splits = modelName.split('-')
                if (splits[0] in Models)
                  desc = `${t(Models[splits[0]].desc)} (${t(ModelMode[splits[1]])})`
              } else {
                if (modelName in Models) desc = t(Models[modelName].desc)
              }
              if (desc)
                return (
                  <option
                    value={modelName}
                    key={modelName}
                    selected={modelName === session.modelName}
                  >
                    {desc}
                  </option>
                )
            })}
          </select>
        </span>
        {/* floatingTool使用的拖拽区域 */}
        {props.draggable && !completeDraggable && (
          <div className="draggable" style={{ flexGrow: 2, cursor: 'move', height: '55px' }} />
        )}
        {/* 模型旁边的几个工具 */}
        <span
          className="gpt-util-group"
          style={{
            padding: '15px 15px 15px 0',
            justifyContent: 'flex-end',
            flexGrow: props.draggable && !completeDraggable ? 0 : 1,
          }}
        >
          {!config.disableWebModeHistory && session && session.conversationId && (
            <a
              title={t('Continue on official website')}
              href={'https://chatgpt.com/chat/' + session.conversationId}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="gpt-util-icon"
              style="color: inherit;"
            >
              <LinkExternalIcon size={16} />
            </a>
          )}
          <WindowDesktop
            className="gpt-util-icon"
            title={t('Float the Window')}
            size={16}
            onClick={() => {
              const position = { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 }
              const toolbarContainer = createElementAtPosition(position.x, position.y)
              toolbarContainer.className = 'chatgptbox-toolbar-container-not-queryable'
              render(
                <FloatingToolbar
                  session={session}
                  selection=""
                  container={toolbarContainer}
                  closeable={true}
                  triggered={true}
                />,
                toolbarContainer,
              )
            }}
          />
          <DeleteButton
            size={16}
            text={t('Clear Conversation')}
            onConfirm={async () => {
              await postMessage({ stop: true })
              Browser.runtime.sendMessage({
                type: 'DELETE_CONVERSATION',
                data: {
                  conversationId: session.conversationId,
                },
              })
              setConversationItemDataArray([])
              const newSession = initSession({
                ...session,
                question: null,
                conversationRecords: [],
              })
              newSession.sessionId = session.sessionId
              setSession(newSession)
            }}
          />
          {!props.pageMode && (
            <span
              title={t('Store to Independent Conversation Page')}
              className="gpt-util-icon"
              onClick={() => {
                const newSession = {
                  ...session,
                  sessionName: new Date().toLocaleString(),
                  autoClean: false,
                  sessionId: uuidv4(),
                }
                setSession(newSession)
                createSession(newSession).then(() =>
                  Browser.runtime.sendMessage({
                    type: 'OPEN_URL',
                    data: {
                      url: Browser.runtime.getURL('IndependentPanel.html') + '?from=store',
                    },
                  }),
                )
              }}
            >
              <ArchiveIcon size={16} />
            </span>
          )}
          {/* 这是单独页面才有的 */}
          {conversationItemDataArray.length > 0 && (
            <span
              title={t('Jump to bottom')}
              className="gpt-util-icon"
              onClick={() => {
                bodyRef.current.scrollTo({
                  top: bodyRef.current.scrollHeight,
                  behavior: 'smooth',
                })
              }}
            >
              <MoveToBottomIcon size={16} />
            </span>
          )}
          <span
            title={t('Save Conversation')}
            className="gpt-util-icon"
            onClick={() => {
              let output = ''
              session.conversationRecords.forEach((data) => {
                output += `${t('Question')}:\n\n${data.question}\n\n${t('Answer')}:\n\n${
                  data.answer
                }\n\n<hr/>\n\n`
              })
              const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
              FileSaver.saveAs(blob, 'conversation.md')
            }}
          >
            <DesktopDownloadIcon size={16} />
          </span>
        </span>
      </div>
      <hr />
      {/* 下面是聊天内容 */}
      <div
        ref={bodyRef}
        className="markdown-body"
        style={
          props.notClampSize
            ? { flexGrow: 1 }
            : { maxHeight: windowSize[1] * 0.55 + 'px', resize: 'vertical' }
        }
      >
        {conversationItemDataArray.map((data, idx) => (
          <ConversationItem
            content={data.content}
            key={idx}
            type={data.type}
            descName={data.type === 'answer' && session.aiName}
            modelName={data.type === 'answer' && session.modelName}
            onRetry={idx === conversationItemDataArray.length - 1 ? retryFn : null}
          />
        ))}
      </div>
      <InputBox
        enabled={isReady}
        postMessage={postMessage}
        reverseResizeDir={props.pageMode}
        onSubmit={async (question) => {
          const newQuestion = new ConversationItemData('question', question)
          const newAnswer = new ConversationItemData(
            'answer',
            `<p class="gpt-loading">${t('Waiting for response...')}</p>`,
          )
          setConversationItemDataArray([...conversationItemDataArray, newQuestion, newAnswer])
          setIsReady(false)

          const newSession = { ...session, question, isRetry: false }
          setSession(newSession)
          try {
            await postMessage({ session: newSession })
          } catch (e) {
            updateAnswer(e, false, 'error')
          }
          bodyRef.current.scrollTo({
            top: bodyRef.current.scrollHeight,
            behavior: 'instant',
          })
        }}
      />
    </div>
  )
}

ConversationCard.propTypes = {
  session: PropTypes.object.isRequired,
  question: PropTypes.string,
  onUpdate: PropTypes.func,
  draggable: PropTypes.bool,
  closeable: PropTypes.bool,
  onClose: PropTypes.func,
  dockable: PropTypes.bool,
  onDock: PropTypes.func,
  notClampSize: PropTypes.bool,
  pageMode: PropTypes.bool,
}

export default memo(ConversationCard)
