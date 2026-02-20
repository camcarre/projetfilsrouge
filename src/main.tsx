import { render } from 'preact'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import App from './App'
import { store } from './store'
import './index.css'

const root = document.getElementById('root')!
render(
  <Provider store={store}>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </Provider>,
  root
)
