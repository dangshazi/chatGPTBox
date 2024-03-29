import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import { Card, FormControlLabel, Grid, Stack, Switch, Typography } from '@mui/material'

import { ModelMode, Models } from '../../config/index.mjs'

GptModelConfig.propTypes = {
  config: PropTypes.object.isRequired,
  updateConfig: PropTypes.func.isRequired,
}

export function GptModelConfig({ config, updateConfig }) {
  // eslint-disable-next-line no-unused-vars
  const { t, i18n } = useTranslation()

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <Stack spacing={2} direction="column" sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              API Parameters
            </Typography>
            {config.apiModes.map((modelName) => {
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
