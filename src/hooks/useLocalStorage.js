import { useEffect, useState } from 'react';

// ----------------------------------------------------------------------

// Learn hooks
export default function useLocalStorage(key, defaultValue) {
  // useState惰性初始化函数和更新函数 https://juejin.cn/post/7022908934235095054
  const [value, setValue] = useState(() => {
    const storedValue = localStorage.getItem(key)
    return storedValue === null ? defaultValue : JSON.parse(storedValue)
  })

  useEffect(() => {
    const listener = (e) => {
      if (e.storageArea === localStorage && e.key === key) {
        setValue(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', listener)

    return () => {
      window.removeEventListener('storage', listener)
    }
  }, [key, defaultValue])

  // 使用函数作为setValue会导致每次渲染都会执行,而不是多次点击只执行一次
  const setValueInLocalStorage = (newValue) => {
    setValue((currentValue) => {
      const result = typeof newValue === 'function' ? newValue(currentValue) : newValue
      localStorage.setItem(key, JSON.stringify(result))
      return result
    })
  }

  return [value, setValueInLocalStorage]
}
