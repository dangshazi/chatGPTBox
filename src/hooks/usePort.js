import { useContext } from 'react'
import { PortContext } from '../contexts/PortContext'

// ----------------------------------------------------------------------

// 3. usePort hooks 返回 PortContext 的值
const usePort = () => useContext(PortContext)

export default usePort
