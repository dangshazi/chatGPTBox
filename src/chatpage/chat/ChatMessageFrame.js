import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
// @mui
import { Box, Divider, Stack, Typography } from '@mui/material'
// redux
import {
  getConversation,
  markConversationAsRead,
  onSendMessage,
  resetActiveConversation,
} from '../../redux/slices/chat'
import { useDispatch, useSelector } from '../../redux/store'
// routes
import { PATH_DASHBOARD } from '../../routes/paths'
//
import ChatMessageInput from './ChatMessageInput'
import ChatMessageList from './ChatMessageList'
import ChatRoom from './ChatRoom'

// utils
import uuidv4 from '../../utils/uuidv4'

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
  const { isReady, postMessage, unfinishedAnswer, answerType, isResponsing } = usePort()
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
    if (!isResponsing && activeConversationId) {
      dispatch(
        onSendMessage({
          conversationId: activeConversationId,
          messageId: uuidv4(),
          message: unfinishedAnswer,
          contentType: 'text',
          attachments: [],
          createdAt: new Date(),
          senderId: oneParticipant.id,
        }),
      )
    }
  }, [isResponsing])

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
      <Stack sx={{ flexGrow: 1 }}>
        {/* 主要聊天内容 */}
        <ChatMessageList conversation={conversation} />
        <Typography>{unfinishedAnswer}</Typography>
        <Typography>{answerType}</Typography>

        <Divider />

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
