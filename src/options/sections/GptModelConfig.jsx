import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import { Card, FormControlLabel, Grid, Stack, Switch, Typography } from '@mui/material'

import { config as toolsConfig } from '../../content-script/selection-tools/index.mjs'

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

            {config.selectionTools.map((key) => (
              <FormControlLabel
                key={key}
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
            ))}
          </Stack>
        </Card>
      </Grid>
    </Grid>
  )
}
