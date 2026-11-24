import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { AppShell } from './components/AppShell.jsx'
import { PinGate } from './components/PinGate.jsx'
import { Button, Card, EmptyState, PageHeader, ToastProvider } from './components/ui.jsx'
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx'
import { Home } from './screens/Home.jsx'
import { Join } from './screens/Join.jsx'
import { MyStatus } from './screens/MyStatus.jsx'
import { Reception } from './screens/Reception.jsx'
import { Barber } from './screens/Barber.jsx'
import { WaitingTV } from './screens/WaitingTV.jsx'
import { Owner } from './screens/Owner.jsx'

function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t('common.notFoundTitle')} subtitle={t('common.notFoundBody')} />
      <Card>
        <EmptyState
          icon={Compass}
          title={t('common.notFoundTitle')}
          description={t('common.notFoundBody')}
          action={<Link to="/"><Button>{t('common.backHome')}</Button></Link>}
        />
      </Card>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/join" element={<Join />} />
              <Route path="/status" element={<MyStatus />} />
              <Route path="/status/:token" element={<MyStatus />} />
              <Route path="/reception" element={<PinGate role="reception"><Reception /></PinGate>} />
              <Route path="/barber/:barberId" element={<PinGate role="barber"><Barber /></PinGate>} />
              <Route path="/tv" element={<WaitingTV />} />
              <Route path="/owner" element={<PinGate role="owner"><Owner /></PinGate>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  )
}
