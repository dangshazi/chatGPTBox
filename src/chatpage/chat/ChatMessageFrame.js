import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
// @mui
import { Box, Divider, IconButton, Stack } from '@mui/material'
// components
import Iconify from '../../components/Iconify'
// redux
import {
  getConversation,
  markConversationAsRead,
  onSendMessage,
  onUpdateMessage,
  resetActiveConversation,
} from '../../redux/slices/chat'
import { useDispatch, useSelector } from '../../redux/store'
// routes
import { PATH_DASHBOARD } from '../../routes/paths'
//
import WritingOutline from '../../components/animate/svg/WritingOutline'
import ChatMessageInput from './ChatMessageInput'
import ChatMessageList from './ChatMessageList'
import ChatRoom from './ChatRoom'

// utils
import usePort from '../../hooks/usePort'

// ----------------------------------------------------------------------

const conversationSelector = (state) => {
  const { conversations, activeConversationId } = state.chat
  const conversation = activeConversationId ? conversations.byId[activeConversationId] : null
  if (conversation) {
    return conversation
  }
  const initState = {
    id: '',
    messages: [],
    participants: [],
    unreadCount: 0,
    type: '',
  }
  return initState
}

export default function ChatMessageFrame() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {
    isReady,
    postMessage,
    currentMessageId,
    unfinishedAnswer,
    error,
    answerType,
    isResponsing,
  } = usePort()
  const { pathname } = useLocation()
  const { conversationKey } = useParams()
  const { participants, activeConversationId } = useSelector((state) => state.chat)
  const conversation = useSelector((state) => conversationSelector(state))

  const mode = conversationKey ? 'DETAIL' : 'COMPOSE'
  const displayParticipants = participants.filter(
    (item) => item.id !== '8864c717-587d-472a-929a-8e5f298024da-0',
  )

  const oneParticipant = [...participants][0]

  useEffect(() => {
    const getConversationDetails = async () => {
      // dispatch(getParticipants(conversationKey))
      try {
        await dispatch(getConversation(conversationKey))
      } catch (error) {
        console.error(error)
        navigate(PATH_DASHBOARD.chat.new)
      }
    }
    if (conversationKey) {
      getConversationDetails()
    } else if (activeConversationId) {
      dispatch(resetActiveConversation())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationKey])

  useEffect(() => {
    if (activeConversationId) {
      dispatch(markConversationAsRead(activeConversationId))
    }
  }, [dispatch, activeConversationId])

  const handleSendMessage = async (value) => {
    try {
      dispatch(onSendMessage(value))
      // 发送消息到backgroud
      postMessage(value)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (answerType === 'answer' && unfinishedAnswer != null && activeConversationId) {
      dispatch(
        onUpdateMessage({
          conversationId: activeConversationId,
          messageId: currentMessageId,
          message: unfinishedAnswer,
          contentType: 'text',
          attachments: [],
          createdAt: new Date(),
          senderId: oneParticipant.id,
        }),
      )
    }

    if (answerType === 'error' && error != null && activeConversationId) {
      dispatch(
        onUpdateMessage({
          conversationId: activeConversationId,
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
  }, [unfinishedAnswer, answerType])

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
      <Stack sx={{ flexGrow: 1 }}>
        {/* 主要聊天内容 */}
        <ChatMessageList conversation={conversation} />
        <Divider
          sx={{
            height: '1px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          }}
        >
          {isResponsing && <WritingOutline />}
        </Divider>
        <Box sx={{ display: 'flex', overflow: 'hidden' }}>
          <IconButton>
            <Iconify icon="eva:book-open-outline" width={20} height={20} />
          </IconButton>
          <Divider orientation="vertical" variant="middle" flexItem />
          <IconButton>
            <Iconify icon="eva:attach-outline" width={20} height={20} />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton>
            <Iconify icon="eva:options-2-outline" width={20} height={20} />
          </IconButton>
          <Divider orientation="vertical" variant="middle" flexItem />
          <IconButton>
            <Iconify icon="material-symbols:device-reset" width={20} height={20} />
          </IconButton>
        </Box>
        {/* <Divider /> */}
        <ChatMessageInput
          conversationId={activeConversationId}
          onSend={handleSendMessage}
          disabled={pathname === PATH_DASHBOARD.chat.new || !isReady}
        />
      </Stack>

      {/* 对话右侧的详细信息 */}
      {mode === 'DETAIL' && (
        <ChatRoom conversation={conversation} participants={displayParticipants} />
      )}
    </Box>
  )
}
