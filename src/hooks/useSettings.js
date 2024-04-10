import { useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

// ----------------------------------------------------------------------

// 3. useSettings hooks 返回 SettingsContext 的值
const useSettings = () => useContext(SettingsContext);

export default useSettings;
