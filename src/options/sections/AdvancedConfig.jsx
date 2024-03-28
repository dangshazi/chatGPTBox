import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import {
  Card,
  FormControlLabel,
  Grid,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

import { parseFloatWithClamp, parseIntWithClamp } from '../../utils/index.mjs'

AdvancedConfig.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

export function AdvancedConfig({ config, updateConfig }) {
  // eslint-disable-next-line no-unused-vars
  const { t, i18n } = useTranslation()

  const tokenMarks = [
    {
      value: 100,
      label: '100',
    },
    // {
    //   value: 2000,
    //   label: '2000',
    // },
    {
      value: 10000,
      label: '10000Tokens',
    },
    {
      value: 40000,
      label: '40000',
    },
  ]

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              API Parameters
            </Typography>

            <Slider
              size="big"
              step={100}
              min={100}
              max={40000}
              valueLabelDisplay="auto"
              marks={tokenMarks}
              value={config.maxResponseTokenLength}
              onChange={(e) => {
                const value = parseIntWithClamp(e.target.value, 1000, 100, 40000)
                updateConfig({ maxResponseTokenLength: value })
              }}
            />
            <Typography>
              {t('Max Response Token Length') + `: ${config.maxResponseTokenLength}`}
            </Typography>

            <Slider
              size="big"
              step={1}
              min={0}
              max={100}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: '0' },
                { value: 100, label: '100' },
              ]}
              value={config.maxConversationContextLength}
              onChange={(e) => {
                const value = parseIntWithClamp(e.target.value, 9, 0, 100)
                updateConfig({ maxConversationContextLength: value })
              }}
            />
            <Typography>
              {t('Max Conversation Length') + `: ${config.maxConversationContextLength}`}
            </Typography>

            <Slider
              size="big"
              step={0.1}
              min={0}
              max={2}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: '0' },
                { value: 2, label: '2' },
              ]}
              value={config.temperature}
              onChange={(e) => {
                const value = parseFloatWithClamp(e.target.value, 1, 0, 2)
                updateConfig({ temperature: value })
              }}
            />
            <Typography>{t('Temperature') + `: ${config.temperature}`}</Typography>
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Custom API & Path
            </Typography>
            <TextField
              name="customChatGptWebApiUrl"
              value={config.customChatGptWebApiUrl}
              label={t('Custom ChatGPT Web API Url')}
              onChange={(e) => {
                const value = e.target.value
                updateConfig({ customChatGptWebApiUrl: value })
              }}
            />
            <TextField
              name="customChatGptWebApiPath"
              value={config.customChatGptWebApiPath}
              label={t('Custom ChatGPT Web API Path')}
              onChange={(e) => {
                const value = e.target.value
                updateConfig({ customChatGptWebApiPath: value })
              }}
            />
            <TextField
              name="customOpenAiApiUrl"
              value={config.customOpenAiApiUrl}
              label={t('Custom OpenAI API Url')}
              onChange={(e) => {
                const value = e.target.value
                updateConfig({ customOpenAiApiUrl: value })
              }}
            />
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              More
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.disableWebModeHistory}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ disableWebModeHistory: checked })
                  }}
                />
              }
              label={t(
                'Disable web mode history for better privacy protection, but it will result in unavailable conversations after a period of time',
              )}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.useSiteRegexOnly}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ useSiteRegexOnly: checked })
                  }}
                />
              }
              label={t(
                'Exclusively use Custom Site Regex for website matching, ignoring built-in rules',
              )}
            />

            <TextField
              name="customSiteRegex"
              value={config.siteRegex}
              label={t('Custom Site Regex')}
              onChange={(e) => {
                const value = e.target.value
                updateConfig({ siteRegex: value })
              }}
            />
            <TextField
              name="inputQuery"
              value={config.inputQuery}
              label={t('Input Query')}
              onChange={(e) => {
                const value = e.target.value
                updateConfig({ inputQuery: value })
              }}
            />
            <TextField
              name="appendQuery"
              value={config.appendQuery}
              label={t('Append Query')}
              onChange={(e) => {
                const value = e.target.value
                updateConfig({ appendQuery: value })
              }}
            />
            <TextField
              name="prependQuery"
              value={config.prependQuery}
              label={t('Prepend Query')}
              onChange={(e) => {
                const value = e.target.value
                updateConfig({ prependQuery: value })
              }}
            />
          </Stack>
        </Card>
      </Grid>
    </Grid>
  )
}
