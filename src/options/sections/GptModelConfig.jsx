import PropTypes from 'prop-types'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'

import Iconify from '../../components/Iconify'

import ApiKeyField from '../../components/passwordField/ApiKeyField'
import {
  AzureOpenAIModels,
  BardWebModels,
  BingWebModels,
  ChatGLMAPIModels,
  ChatgptWebModels,
  ClaudeAPIModels,
  ClaudeWebModels,
  ModelMode,
  Models,
  MoonshotAPIModels,
  MoonshotWebModels,
  OpenAIAPIModels,
  POEWebModels,
} from '../../config/index.mjs'

GptModelConfig.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
  removeConfig: PropTypes.func.isRequired,
}

export function GptModelConfig({ config, updateConfig, removeConfig }) {
  // eslint-disable-next-line no-unused-vars
  const { t, i18n } = useTranslation()
  // console.info(OpenAIAPIModels)

  const clearConfig = (e, key) => {
    console.debug('clear config', key)
    removeConfig(key)
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Models via API
        </Typography>
      </Grid>
      {/* API */}
      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              OpenAI Models via API
            </Typography>
            <ApiKeyField
              name={'ApiKey'}
              value={config.apiKey}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ apiKey: apiKey })
              }}
            />
            {Object.keys(OpenAIAPIModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Moonshot Models via API
            </Typography>
            <ApiKeyField
              name={'ApiKey'}
              value={config.moonshotApiKey}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ moonshotApiKey: apiKey })
              }}
            />
            {Object.keys(MoonshotAPIModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Claude Models via API
            </Typography>
            <ApiKeyField
              name={'ApiKey'}
              value={config.claudeApiKey}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ claudeApiKey: apiKey })
              }}
            />
            {Object.keys(ClaudeAPIModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Azure Models via API
            </Typography>
            <ApiKeyField
              name={'ApiKey'}
              value={config.azureApiKey}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ azureApiKey: apiKey })
              }}
            />
            {Object.keys(AzureOpenAIModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              ChatGLM Models via API
            </Typography>
            <ApiKeyField
              name={'ApiKey'}
              value={config.chatglmApiKey}
              onChange={(e) => {
                const apiKey = e.target.value
                updateConfig({ chatglmApiKey: apiKey })
              }}
            />
            {Object.keys(ChatGLMAPIModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>
      {/* Web */}

      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Models via Web
        </Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              OpenAI Models via Web
              <Tooltip title="Clear access token" arrow>
                <IconButton onClick={(e) => clearConfig(e, 'accessToken')}>
                  <Iconify icon={'icon-park-solid:clear-format'} width={15} height={15} />
                </IconButton>
              </Tooltip>
            </Typography>
            {Object.keys(ChatgptWebModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Bing Models via Web
            </Typography>
            {Object.keys(BingWebModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Poe Models via Web
            </Typography>
            {Object.keys(POEWebModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Claude Models via Web
            </Typography>
            {Object.keys(ClaudeWebModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Moonshot Models via Web
            </Typography>
            {Object.keys(MoonshotWebModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Bard Models via Web
            </Typography>
            {Object.keys(BardWebModels).map((modelName) => {
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
                  <FormControlLabel
                    key={modelName}
                    control={
                      <Switch
                        checked={config.activeApiModes.includes(modelName)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const activeApiModes = config.activeApiModes.filter(
                            (i) => i !== modelName,
                          )
                          if (checked) activeApiModes.push(modelName)
                          updateConfig({ activeApiModes })
                        }}
                      />
                    }
                    label={desc}
                  />
                )
            })}
          </Stack>
        </Card>
      </Grid>
    </Grid>
  )
}
