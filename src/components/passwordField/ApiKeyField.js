import PropTypes from 'prop-types'
import { useState } from 'react'

import { FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput } from '@mui/material'

import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
// @mui

// ----------------------------------------------------------------------

ApiKeyField.propTypes = {
  name: PropTypes.string,
}

export default function ApiKeyField({ name, ...other }) {
  const [showApiKey, setShowApiKey] = useState(false)

  const handleClickShowApiKey = () => setShowApiKey((show) => !show)

  const handleMouseDownApiKey = (event) => {
    event.preventDefault()
  }

  return (
    <FormControl>
      <InputLabel htmlFor="outlined-adornment-apikey">{name}</InputLabel>
      <OutlinedInput
        id="outlined-adornment-apikey"
        type={showApiKey ? 'text' : 'password'}
        {...other}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle apikey visibility"
              onClick={handleClickShowApiKey}
              onMouseDown={handleMouseDownApiKey}
              edge="end"
            >
              {showApiKey ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        label={name}
      />
    </FormControl>
  )
}
