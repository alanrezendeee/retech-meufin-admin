import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Alert, Snackbar } from '@mui/material'

type Severity = 'success' | 'error' | 'info' | 'warning'

type ToastState = { msg: string; severity: Severity } | null

type ToastCtx = {
  show: (msg: string, severity?: Severity) => void
}

const Ctx = createContext<ToastCtx>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>(null)

  const show = useCallback((msg: string, severity: Severity = 'success') => {
    setState({ msg, severity })
  }, [])

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <Snackbar
        open={Boolean(state)}
        autoHideDuration={4000}
        onClose={() => setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={state?.severity ?? 'success'}
          variant="filled"
          onClose={() => setState(null)}
          sx={{ minWidth: 280 }}
        >
          {state?.msg}
        </Alert>
      </Snackbar>
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook e provider vivem juntos por design
export function useToast() {
  return useContext(Ctx)
}
