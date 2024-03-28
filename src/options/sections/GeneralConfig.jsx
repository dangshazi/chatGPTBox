import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Browser from 'webextension-polyfill'
import {
  ModelMode,
  Models,
  ThemeMode,
  TriggerMode,
  isUsingAzureOpenAi,
  isUsingChatGLMApi,
  isUsingClaudeApi,
  isUsingCustomModel,
  isUsingCustomNameOnlyModel,
  isUsingGithubThirdPartyApi,
  isUsingMoonshotApi,
  isUsingMultiModeModel,
  isUsingOpenAiApiKey,
} from '../../config/index.mjs'
import { languageList } from '../../config/language.mjs'
import { config as menuConfig } from '../../content-script/menu-tools'

import {
  Card,
  FormControlLabel,
  Grid,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

import { config as toolsConfig } from '../../content-script/selection-tools/index.mjs'
import { isFirefox, isMobile, isSafari, openUrl } from '../../utils/index.mjs'

GeneralConfig.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  return `${year}-${month}-${day}`
}

async function checkBilling(apiKey, apiUrl) {
  const now = new Date()
  let startDate = new Date(now - 90 * 24 * 60 * 60 * 1000)
  const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const subDate = new Date(now)
  subDate.setDate(1)

  // API 已经废弃
  const urlSubscription = `${apiUrl}/v1/dashboard/billing/subscription`
  let urlUsage = `${apiUrl}/v1/dashboard/billing/usage?start_date=${formatDate(
    startDate,
  )}&end_date=${formatDate(endDate)}`
  const headers = {
    Authorization: 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
  }

  try {
    let response = await fetch(urlSubscription, { headers })
    if (!response.ok) {
      console.log('Your account has been suspended. Please log in to OpenAI to check.')
      return [null, null, null]
    }
    const subscriptionData = await response.json()
    const totalAmount = subscriptionData.hard_limit_usd

    if (totalAmount > 20) {
      startDate = subDate
    }

    urlUsage = `${apiUrl}/v1/dashboard/billing/usage?start_date=${formatDate(
      startDate,
    )}&end_date=${formatDate(endDate)}`

    response = await fetch(urlUsage, { headers })
    const usageData = await response.json()
    const totalUsage = usageData.total_usage / 100
    const remaining = totalAmount - totalUsage

    return [totalAmount, totalUsage, remaining]
  } catch (error) {
    console.error(error)
    return [null, null, null]
  }
}

export function GeneralConfig({ config, updateConfig }) {
  const { t, i18n } = useTranslation()
  const [balance, setBalance] = useState(null)
  const [backgroundPermission, setBackgroundPermission] = useState(false)

  if (!isMobile() && !isFirefox() && !isSafari()) {
    Browser.permissions.contains({ permissions: ['background'] }).then((result) => {
      setBackgroundPermission(result)
    })
  }

  const getBalance = async () => {
    // API 已经废弃
    const response = await fetch(`${config.customOpenAiApiUrl}/dashboard/billing/credit_grants`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    })
    if (response.ok) setBalance((await response.json()).total_available.toFixed(2))
    else {
      const billing = await checkBilling(config.apiKey, config.customOpenAiApiUrl)
      if (billing && billing.length > 2 && billing[2]) setBalance(`${billing[2].toFixed(2)}`)
      else openUrl('https://platform.openai.com/account/usage')
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <FormControl>
              <InputLabel id="theme">{t('Theme')}</InputLabel>
              <Select
                fullWidth
                labelId="theme"
                name="theme"
                label="Theme"
                // InputLabelProps={{ shrink: true }}
                // SelectProps={{ native: false, sx: { textTransform: 'capitalize' } }}
                onChange={(e) => {
                  const mode = e.target.value
                  updateConfig({ themeMode: mode })
                }}
                value={config.themeMode}
              >
                {Object.entries(ThemeMode).map(([key, desc]) => {
                  return (
                    <MenuItem
                      key={key}
                      value={key}
                      sx={{
                        mx: 1,
                        my: 0.5,
                        borderRadius: 0.75,
                        typography: 'body2',
                        // textTransform: 'capitalize',
                      }}
                    >
                      {t(desc)}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="language">{t('Preferred Language')}</InputLabel>
              <Select
                fullWidth
                labelId="language"
                name="language"
                label="Language"
                // InputLabelProps={{ shrink: true }}
                // SelectProps={{ native: false, sx: { textTransform: 'capitalize' } }}
                onChange={(e) => {
                  const preferredLanguageKey = e.target.value
                  updateConfig({ preferredLanguage: preferredLanguageKey })

                  let lang
                  if (preferredLanguageKey === 'auto') lang = config.userLanguage
                  else lang = preferredLanguageKey
                  i18n.changeLanguage(lang)

                  // 为什么要通知所有页面？
                  Browser.tabs.query({}).then((tabs) => {
                    tabs.forEach((tab) => {
                      Browser.tabs
                        .sendMessage(tab.id, {
                          type: 'CHANGE_LANG',
                          data: {
                            lang,
                          },
                        })
                        .catch(() => {})
                    })
                  })
                }}
                value={config.preferredLanguage}
              >
                {Object.entries(languageList).map(([key, desc]) => {
                  return (
                    <MenuItem
                      key={key}
                      value={key}
                      sx={{
                        mx: 1,
                        my: 0.5,
                        borderRadius: 0.75,
                        typography: 'body2',
                        // textTransform: 'capitalize',
                      }}
                    >
                      {t(desc.native)}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="clickIconAction">{t('When Icon Clicked')}</InputLabel>
              <Select
                fullWidth
                labelId="clickIconAction"
                name="clickIconAction"
                label="ClickIconAction"
                // InputLabelProps={{ shrink: true }}
                // SelectProps={{ native: false, sx: { textTransform: 'capitalize' } }}
                onChange={(e) => {
                  const mode = e.target.value
                  updateConfig({ clickIconAction: mode })
                }}
                value={config.clickIconAction}
              >
                <MenuItem
                  key="popup"
                  value="popup"
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 0.75,
                    typography: 'body2',
                    // textTransform: 'capitalize',
                  }}
                >
                  {t('Open Settings')}
                </MenuItem>
                {Object.entries(menuConfig).map(([key, desc]) => {
                  return (
                    <MenuItem
                      key={key}
                      value={key}
                      sx={{
                        mx: 1,
                        my: 0.5,
                        borderRadius: 0.75,
                        typography: 'body2',
                        // textTransform: 'capitalize',
                      }}
                    >
                      {t(desc.label)}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="triggers">{t('Triggers')}</InputLabel>
              <Select
                fullWidth
                labelId="triggers"
                name="triggers"
                label="Triggers"
                // InputLabelProps={{ shrink: true }}
                // SelectProps={{ native: false, sx: { textTransform: 'capitalize' } }}
                onChange={(e) => {
                  const mode = e.target.value
                  updateConfig({ triggerMode: mode })
                }}
                value={config.triggerMode}
              >
                {Object.entries(TriggerMode).map(([key, desc]) => {
                  return (
                    <MenuItem
                      key={key}
                      value={key}
                      sx={{
                        mx: 1,
                        my: 0.5,
                        borderRadius: 0.75,
                        typography: 'body2',
                        // textTransform: 'capitalize',
                      }}
                    >
                      {t(desc)}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="model">Model</InputLabel>
              <Select
                fullWidth
                labelId="model"
                name="Model"
                label="Model"
                // InputLabelProps={{ shrink: true }}
                // SelectProps={{ native: false, sx: { textTransform: 'capitalize' } }}
                onChange={(e) => {
                  const modelName = e.target.value
                  updateConfig({ modelName: modelName })
                }}
                value={config.modelName}
              >
                {config.activeApiModes.map((modelName) => {
                  let desc
                  // 这里对'-'做了处理 为了处理ModelMode
                  if (modelName.includes('-')) {
                    const splits = modelName.split('-')
                    if (splits[0] in Models)
                      desc = `${t(Models[splits[0]].desc)} (${t(ModelMode[splits[1]])})`
                  } else {
                    if (modelName in Models) desc = t(Models[modelName].desc)
                  }
                  if (desc)
                    return (
                      <MenuItem
                        key={modelName}
                        value={modelName}
                        sx={{
                          mx: 1,
                          my: 0.5,
                          borderRadius: 0.75,
                          typography: 'body2',
                          // textTransform: 'capitalize',
                        }}
                      >
                        {desc}
                      </MenuItem>
                    )
                })}
              </Select>
            </FormControl>
            {/* TODO: delete  */}
            {false && (
              <label>
                <legend>{t('API Mode')}</legend>
                <span style="display: flex; gap: 15px;">
                  <select
                    style={
                      isUsingOpenAiApiKey(config) ||
                      isUsingMultiModeModel(config) ||
                      isUsingCustomModel(config) ||
                      isUsingAzureOpenAi(config) ||
                      isUsingClaudeApi(config) ||
                      isUsingCustomNameOnlyModel(config) ||
                      isUsingMoonshotApi(config)
                        ? 'width: 50%;'
                        : undefined
                    }
                    required
                    onChange={(e) => {
                      const modelName = e.target.value
                      updateConfig({ modelName: modelName })
                    }}
                  >
                    {config.activeApiModes.map((modelName) => {
                      let desc
                      // 这里对'-'做了处理 为了处理ModelMode
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
                            selected={modelName === config.modelName}
                          >
                            {desc}
                          </option>
                        )
                    })}
                  </select>
                  {/* 未处理配置key和balance的逻辑 */}
                  {isUsingMultiModeModel(config) && (
                    <select
                      style="width: 50%;"
                      required
                      onChange={(e) => {
                        const modelMode = e.target.value
                        updateConfig({ modelMode: modelMode })
                      }}
                    >
                      {Object.entries(ModelMode).map(([key, desc]) => {
                        return (
                          <option value={key} key={key} selected={key === config.modelMode}>
                            {t(desc)}
                          </option>
                        )
                      })}
                    </select>
                  )}
                  {isUsingOpenAiApiKey(config) && (
                    <span style="width: 50%; display: flex; gap: 5px;">
                      <input
                        type="password"
                        value={config.apiKey}
                        placeholder={t('API Key')}
                        onChange={(e) => {
                          const apiKey = e.target.value
                          updateConfig({ apiKey: apiKey })
                        }}
                      />
                      {config.apiKey.length === 0 ? (
                        <a
                          href="https://platform.openai.com/account/api-keys"
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                        >
                          <button style="white-space: nowrap;" type="button">
                            {t('Get')}
                          </button>
                        </a>
                      ) : balance ? (
                        <button type="button" onClick={getBalance}>
                          {balance}
                        </button>
                      ) : (
                        <button type="button" onClick={getBalance}>
                          {t('Balance')}
                        </button>
                      )}
                    </span>
                  )}
                  {isUsingCustomModel(config) && (
                    <input
                      style="width: 50%;"
                      type="text"
                      value={config.customModelName}
                      placeholder={t('Model Name')}
                      onChange={(e) => {
                        const customModelName = e.target.value
                        updateConfig({ customModelName: customModelName })
                      }}
                    />
                  )}
                  {isUsingCustomNameOnlyModel(config) && (
                    <input
                      style="width: 50%;"
                      type="text"
                      value={config.poeCustomBotName}
                      placeholder={t('Bot Name')}
                      onChange={(e) => {
                        const customName = e.target.value
                        updateConfig({ poeCustomBotName: customName })
                      }}
                    />
                  )}
                  {isUsingAzureOpenAi(config) && (
                    <input
                      type="password"
                      style="width: 50%;"
                      value={config.azureApiKey}
                      placeholder={t('Azure API Key')}
                      onChange={(e) => {
                        const apiKey = e.target.value
                        updateConfig({ azureApiKey: apiKey })
                      }}
                    />
                  )}
                  {isUsingClaudeApi(config) && (
                    <input
                      type="password"
                      style="width: 50%;"
                      value={config.claudeApiKey}
                      placeholder={t('Claude API Key')}
                      onChange={(e) => {
                        const apiKey = e.target.value
                        updateConfig({ claudeApiKey: apiKey })
                      }}
                    />
                  )}
                  {isUsingChatGLMApi(config) && (
                    <input
                      type="password"
                      style="width: 50%;"
                      value={config.chatglmApiKey}
                      placeholder={t('ChatGLM API Key')}
                      onChange={(e) => {
                        const apiKey = e.target.value
                        updateConfig({ chatglmApiKey: apiKey })
                      }}
                    />
                  )}
                  {isUsingMoonshotApi(config) && (
                    <span style="width: 50%; display: flex; gap: 5px;">
                      <input
                        type="password"
                        value={config.moonshotApiKey}
                        placeholder={t('Moonshot API Key')}
                        onChange={(e) => {
                          const apiKey = e.target.value
                          updateConfig({ moonshotApiKey: apiKey })
                        }}
                      />
                      {config.moonshotApiKey.length === 0 && (
                        <a
                          href="https://platform.moonshot.cn/console/api-keys"
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                        >
                          <button style="white-space: nowrap;" type="button">
                            {t('Get')}
                          </button>
                        </a>
                      )}
                    </span>
                  )}
                </span>
                {isUsingCustomModel(config) && (
                  <input
                    type="text"
                    value={config.customModelApiUrl}
                    placeholder={t('Custom Model API Url')}
                    onChange={(e) => {
                      const value = e.target.value
                      updateConfig({ customModelApiUrl: value })
                    }}
                  />
                )}
                {isUsingCustomModel(config) && (
                  <input
                    type="password"
                    value={config.customApiKey}
                    placeholder={t('API Key')}
                    onChange={(e) => {
                      const apiKey = e.target.value
                      updateConfig({ customApiKey: apiKey })
                    }}
                  />
                )}
                {isUsingAzureOpenAi(config) && (
                  <input
                    type="password"
                    value={config.azureEndpoint}
                    placeholder={t('Azure Endpoint')}
                    onChange={(e) => {
                      const endpoint = e.target.value
                      updateConfig({ azureEndpoint: endpoint })
                    }}
                  />
                )}
                {isUsingAzureOpenAi(config) && (
                  <input
                    type="text"
                    value={config.azureDeploymentName}
                    placeholder={t('Azure Deployment Name')}
                    onChange={(e) => {
                      const deploymentName = e.target.value
                      updateConfig({ azureDeploymentName: deploymentName })
                    }}
                  />
                )}
                {isUsingGithubThirdPartyApi(config) && (
                  <input
                    type="text"
                    value={config.githubThirdPartyUrl}
                    placeholder={t('API Url')}
                    onChange={(e) => {
                      const url = e.target.value
                      updateConfig({ githubThirdPartyUrl: url })
                    }}
                  />
                )}
              </label>
            )}
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Chat Window
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.alwaysPinWindow}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ alwaysPinWindow: checked })
                  }}
                />
              }
              label={t('Always pin the floating window')}
            />
            {!isMobile() && !isFirefox() && !isSafari() && (
              <FormControlLabel
                control={
                  <Switch
                    checked={backgroundPermission}
                    onChange={(e) => {
                      const checked = e.target.checked
                      if (checked)
                        Browser.permissions
                          .request({ permissions: ['background'] })
                          .then((result) => {
                            setBackgroundPermission(result)
                          })
                      else
                        Browser.permissions
                          .remove({ permissions: ['background'] })
                          .then((result) => {
                            setBackgroundPermission(result)
                          })
                    }}
                  />
                }
                label={t('Keep Conversation Window in Background')}
              />
            )}
            {!isMobile() && (
              <FormControlLabel
                control={
                  <Switch
                    checked={config.alwaysCreateNewConversationWindow}
                    onChange={(e) => {
                      const checked = e.target.checked
                      updateConfig({ alwaysCreateNewConversationWindow: checked })
                    }}
                  />
                }
                label={t('Always Create New Conversation Window')}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={config.focusAfterAnswer}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ focusAfterAnswer: checked })
                  }}
                />
              }
              label={t('Focus to input box after answering')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.lockWhenAnswer}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ lockWhenAnswer: checked })
                  }}
                />
              }
              label={t('Lock scrollbar while answering')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoRegenAfterSwitchModel}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ autoRegenAfterSwitchModel: checked })
                  }}
                />
              }
              label={t('Regenerate the answer after switching model')}
            />
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Page Injection
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.insertAtTop}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ insertAtTop: checked })
                  }}
                />
              }
              label={t('Insert ChatGPT at the top of search results')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.selectionToolsNextToInputBox}
                  onChange={(e) => {
                    const checked = e.target.checked
                    updateConfig({ selectionToolsNextToInputBox: checked })
                  }}
                />
              }
              label={t('Display selection tools next to input box to avoid blocking')}
            />
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Selection Tool
            </Typography>
            {config.selectionTools.map((key) => (
              <label key={key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.activeSelectionTools.includes(key)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const activeSelectionTools = config.activeSelectionTools.filter(
                          (i) => i !== key,
                        )
                        if (checked) activeSelectionTools.push(key)
                        updateConfig({ activeSelectionTools })
                      }}
                    />
                  }
                  label={t(toolsConfig[key].label)}
                />
              </label>
            ))}
          </Stack>
        </Card>
      </Grid>
    </Grid>
  )
}
