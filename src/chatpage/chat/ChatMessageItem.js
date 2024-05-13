import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import PropTypes from 'prop-types';
// @mui
import { Avatar, Box, Typography, IconButton, } from '@mui/material';

import { styled } from '@mui/material/styles';
// components
import Image from '../../components/Image';
// hooks
import useResponsive from '../../hooks/useResponsive';
// components
import Iconify from '../../components/Iconify'

import { MuiMarkdown, getOverrides } from 'mui-markdown';

// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
}))

const ContentStyle = styled('div')(({ theme }) => ({
  minWidth: 1,
  maxWidth: 720,
  padding: theme.spacing(1),
  marginTop: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.neutral,
}))

const InfoStyle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  marginBottom: theme.spacing(0.75),
  color: theme.palette.text.secondary,
}))

const ErrorStyle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(0.75),
  color: theme.palette.error.main,
}))

// ----------------------------------------------------------------------

ChatMessageItem.propTypes = {
  message: PropTypes.object.isRequired,
  conversation: PropTypes.object.isRequired,
  onOpenLightbox: PropTypes.func,
}

export default function ChatMessageItem({ message, conversation, onOpenLightbox }) {
  // truncte message
  const messageSummary = message.body.length > 100 ? message.body.slice(0, 100) + '...' : message.body

  const isMobile = useResponsive('down', 'md');
  const [expanded, setExpanded] = useState(true);
  const sender = conversation.participants.find(
    (participant) => participant.id === message.senderId,
  )
  const senderDetails =
    message.senderId === '8864c717-587d-472a-929a-8e5f298024da-0'
      ? { type: 'me' }
      : { avatar: sender?.avatar, name: sender?.name }

  const isMe = senderDetails.type === 'me'
  const isImage = message.contentType === 'image'
  const firstName = senderDetails.name && senderDetails.name.split(' ')[0]

  return (
    <RootStyle>
      <Box
        sx={{
          display: 'flex',
          ...(isMe && {
            ml: 'auto',
          }),
        }}
      >
        {senderDetails.type !== 'me' && !isMobile && (
          <Avatar
            alt={senderDetails.name}
            src={senderDetails.avatar}
            sx={{ width: 32, height: 32, mr: 2 }}
          />
        )}

        <div>
          <InfoStyle
            variant="caption"
            sx={{
              ...(isMe && { justifyContent: 'flex-end' }),
            }}
          >
            {!isMe && `${firstName},`}&nbsp;
            {formatDistanceToNowStrict(new Date(message.createdAt), {
              addSuffix: true,
            })}
          </InfoStyle>

          <ContentStyle
            sx={{
              ...(isMe && { color: 'grey.800', bgcolor: 'primary.lighter' }),
              ...(isImage && { p: 0 }),
            }}
          >
            {isImage ? (
              <Image
                alt="attachment"
                src={message.body}
                onClick={() => onOpenLightbox(message.body)}
                sx={{ borderRadius: 1, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              />
            ) : (
              <MuiMarkdown
                overrides={{
                  ...getOverrides(),
                }}
                style={{ wordWrap: 'break-word' }}
                variant="body3"
              >
                {expanded ? message.body : messageSummary}
              </MuiMarkdown>
            )}
          </ContentStyle>
          {message.error != null && (
            <ErrorStyle
              variant="caption"
              sx={{
                ...(isMe && { justifyContent: 'flex-end' }),
              }}
            >
              {message.error}
            </ErrorStyle>
          )}

          <Box sx={{ display: 'flex', }}>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <Iconify icon="eva:arrow-ios-downward-outline" width={13} height={13} /> : <Iconify icon="eva:arrow-ios-forward-outline" width={13} height={13} />}
            </IconButton>
            <IconButton>
              <Iconify icon="eva:sync-outline" width={13} height={13} />
            </IconButton>
            <IconButton>
              <Iconify icon="fa6-regular:paste" width={13} height={13} />
            </IconButton>
            <IconButton>
              <Iconify icon="eva:bookmark-outline" width={13} height={13} />
            </IconButton>
            <IconButton>
              <Iconify icon="eva:trash-2-outline" width={13} height={13} />
            </IconButton>
          </Box>
        </div>
      </Box>
    </RootStyle>
  )
}