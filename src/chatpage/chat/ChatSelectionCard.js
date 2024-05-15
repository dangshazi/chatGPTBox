import { useEffect } from 'react';
// @mui
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Button, Card, CardContent, CardHeader, Divider, IconButton, Typography } from '@mui/material';
import { MuiMarkdown, getOverrides } from 'mui-markdown';

import { useState } from 'react';
import Browser from 'webextension-polyfill';

// ----------------------------------------------------------------------

export default function ChatSelectionCard() {
  const [selectionContent, setSelectionContent] = useState(null)

  useEffect(() => {
    const listener = (changes) => {
      if (changes['selectionContent']) {
        setSelectionContent(changes['selectionContent'].newValue)
      }
    }
    Browser.storage.local.onChanged.addListener(listener)
    return () => {
      Browser.storage.local.onChanged.removeListener(listener)
    }
  }, [])

  return (
    <Box sx={{ maxHeight: '50%' }}>
      {selectionContent && (
        <Card sx={{ margin: 1, padding: 0.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CardHeader
            action={
              <IconButton aria-label="settings">
                <MoreVertIcon />
              </IconButton>
            }
            sx={{ padding: 1 }}

            title={
              <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                Your Selection Content:
              </Typography>
            }
          />
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small">Summary</Button>
            <Button size="small">Translate</Button>
            <Button size="small">Save</Button>
            <Button size="small">Copy</Button>
          </Box>
          <Divider />
          <CardContent sx={{ paddingX: 2, paddingY: 0, overflow: 'scroll' }}>
            <MuiMarkdown
              overrides={{
                ...getOverrides(),
              }}
              style={{ wordWrap: 'break-word' }}
            >
              {selectionContent}
            </MuiMarkdown>
          </CardContent>
        </Card>)
      }
    </Box>
  )
}
