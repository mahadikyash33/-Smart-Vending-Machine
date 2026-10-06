import { useMemo, useState } from 'react'

type MachineState = 'Idle' | 'Selection' | 'Payment' | 'Dispensing' | 'Refunding' | 'OutOfStock'
type PaymentMethod = 'Coin' | 'Note' | 'RFID' | 'QR Pay' | 'Wallet'
type Product = { id: string; name: string; category: string; price: number; stock: number; accent: string; symbol: string }
type Trace = { time: string; from: MachineState; input: string; output: string; to: MachineState }

const initialProducts: Product[] = [
  { id: 'spark', name: 'Sparkling Water', category: 'Hydration', price: 2.5, stock: 8, accent: '#c7f0e0', symbol: 'SW' },
  { id: 'crunch', name: 'Cocoa Crunch', category: 'Snack', price: 3, stock: 5, accent: '#f4d6a7', symbol: 'CC' },
  { id: 'citrus', name: 'Citrus Charge', category: 'Energy', price: 4.5, stock: 3, accent: '#f5ee9e', symbol: 'CX' },
  { id: 'trail', name: 'Trail Mix', category: 'Snack', price: 5, stock: 0, accent: '#d8c5aa', symbol: 'TM' },
]

const payments: { method: PaymentMethod; label: string; detail: string; icon: string }[] = [
  { method: 'Coin', label: 'Coins', detail: 'Exact or overpay', icon: '¢' },
  { method: 'Note', label: 'Notes', detail: '$5 / $10 accepted', icon: '$' },
  { method: 'RFID', label: 'RFID card', detail: 'Tap to authorize', icon: ')))' },
  { method: 'QR Pay', label: 'QR payment', detail: 'Scan and confirm', icon: '▦' },
  { method: 'Wallet', label: 'Mobile wallet', detail: 'Tap to pay', icon: '◉' },
]

const transitionRows: { state: MachineState; input: string; output: string; next: MachineState }[] = [
  { state: 'Idle', input: 'SELECT(product)', output: 'Show product / price', next: 'Selection' },
  { state: 'Selection', input: 'PAY(method)', output: 'Credit payment', next: 'Payment' },
  { state: 'Payment', input: 'PAY(method)', output: 'Dispense + return change', next: 'Dispensing' },
  { state: 'Selection', input: 'REFUND', output: 'Return balance', next: 'Refunding' },
  { state: 'Selection', input: 'SELECT(out-of-stock)', output: 'Unavailable notice', next: 'OutOfStock' },
  { state: 'Dispensing', input: 'DELIVER', output: 'Update inventory', next: 'Idle' },
]

const money = (value: number) => `$${value.toFixed(2)}`

function App() {
  const [machineState, setMachineState] = useState<MachineState>('Idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [products, setProducts] = useState(initialProducts)
  const [traces, setTraces] = useState<Trace[]>([])
  const [message, setMessage] = useState('Ready for your order')

  const selected = products.find((product) => product.id === selectedId)
  const paidPercent = selected ? Math.min(100, (balance / selected.price) * 100) : 0
  const stockUnits = products.reduce((total, product) => total + product.stock, 0)

  const addTrace = (from: MachineState, input: string, output: string, to: MachineState) => {
    setTraces((current) => [
      { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), from, input, output, to },
      ...current,
    ].slice(0, 7))
  }

  const selectProduct = (product: Product) => {
    if (balance > 0) {
      const refundOutput = `Returning ${money(balance)} before changing selection`
      addTrace(machineState, 'SELECT(new product)', refundOutput, 'Refunding')
      setBalance(0)
    }
    const nextState: MachineState = product.stock === 0 ? 'OutOfStock' : 'Selection'
    const output = product.stock === 0 ? `${product.name} unavailable` : `${product.name} selected · insert ${money(product.price)}`
    setSelectedId(product.id)
    setMachineState(nextState)
    setMessage(output)
    addTrace(balance > 0 ? 'Refunding' : machineState, `SELECT(${product.id.toUpperCase()})`, output, nextState)
  }

  const addPayment = (method: PaymentMethod) => {
    if (!selected || selected.stock === 0) return
    const amount = method === 'Coin' ? 1 : method === 'Note' ? 5 : selected.price
    const nextBalance = Number((balance + amount).toFixed(2))
    const nextState: MachineState = nextBalance >= selected.price ? 'Dispensing' : 'Payment'
    const output = nextState === 'Dispensing' ? `Authorized ${money(amount)} · dispensing ${selected.name}` : `${method} accepted · ${money(nextBalance)} credited`
    setBalance(nextBalance)
    setMachineState(nextState)
    setMessage(output)
    addTrace(machineState, `PAY(${method.toUpperCase()})`, output, nextState)
    if (nextState === 'Dispensing') {
      window.setTimeout(() => dispense(selected, nextBalance), 650)
    }
  }

  const dispense = (product: Product, paid: number) => {
    const change = Number(Math.max(0, paid - product.price).toFixed(2))
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: item.stock - 1 } : item))
    setMachineState(change > 0 ? 'Refunding' : 'Idle')
    setMessage(change > 0 ? `${product.name} dispensed · returning ${money(change)}` : `${product.name} dispensed · thank you`)
    addTrace('Dispensing', 'DELIVER', change > 0 ? `Product delivered + ${money(change)} change` : 'Product delivered', change > 0 ? 'Refunding' : 'Idle')
    setBalance(0)
    setSelectedId(null)
    if (change > 0) window.setTimeout(() => setMachineState('Idle'), 700)
  }

  const refund = () => {
    if (balance === 0) return
    const output = `Returning ${money(balance)} to customer`
    addTrace(machineState, 'REFUND', output, 'Refunding')
    setMachineState('Refunding')
    setMessage(output)
    window.setTimeout(() => {
      setBalance(0)
      setSelectedId(null)
      setMachineState('Idle')
      setMessage('Ready for your order')
    }, 600)
  }

  const reset = () => {
    setMachineState('Idle')
    setSelectedId(null)
    setBalance(0)
    setProducts(initialProducts)
    setTraces([])
    setMessage('Ready for your order')
  }

  const stateMeta = useMemo(() => ({
    Idle: { tone: 'mint', description: 'Waiting for customer input' },
    Selection: { tone: 'lime', description: 'Product chosen, awaiting payment' },
    Payment: { tone: 'amber', description: 'Accumulating payment' },
    Dispensing: { tone: 'blue', description: 'Delivering product' },
    Refunding: { tone: 'violet', description: 'Returning balance' },
    OutOfStock: { tone: 'red', description: 'Selection blocked' },
  } as Record<MachineState, { tone: string; description: string }>)[machineState], [machineState])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">SV</span><span>SMART VEND <small>MEALY MACHINE LAB</small></span></div>
        <div className="top-actions"><span className="live-dot" /> LIVE SIMULATION <button className="reset-button" onClick={reset}>Reset machine</button></div>
      </header>

      <section className="intro">
        <div><p className="eyebrow">CASE STUDY 02 / FORMAL MODEL</p><h1>Every input creates<br /><em>a visible outcome.</em></h1><p className="intro-copy">Explore a vending machine modeled as a Mealy machine: outputs are produced from the current state and the input received.</p></div>
        <div className="machine-summary"><span>STATE REGISTER</span><strong>{machineState.toUpperCase()}</strong><p>{stateMeta.description}</p></div>
      </section>

      <section className="dashboard-grid">
        <div className="panel machine-panel">
          <div className="panel-heading"><div><span className="section-label">01 / PRODUCT BAY</span><h2>Choose your product</h2></div><span className="inventory-count">{stockUnits} units total</span></div>
          <div className="product-grid">
            {products.map((product) => <button className={`product ${selectedId === product.id ? 'selected' : ''} ${product.stock === 0 ? 'sold-out' : ''}`} key={product.id} onClick={() => selectProduct(product)}>
              <span className="product-art" style={{ background: product.accent }}>{product.symbol}</span><span className="product-info"><b>{product.name}</b><small>{product.category}</small></span><span className="product-price">{money(product.price)}</span><span className="stock-bar"><i style={{ width: `${Math.min(100, product.stock * 12.5)}%` }} /></span><span className="stock-text">{product.stock === 0 ? 'SOLD OUT' : `${product.stock} available`}</span>
            </button>)}
          </div>
          <div className="payment-zone"><div className="panel-heading compact"><div><span className="section-label">02 / INPUT ALPHABET</span><h2>Authorize payment</h2></div><span className="payment-balance">CREDIT <strong>{money(balance)}</strong></span></div><div className="payment-grid">{payments.map((payment) => <button className="payment-button" key={payment.method} disabled={!selected || selected.stock === 0 || machineState === 'Dispensing'} onClick={() => addPayment(payment.method)}><span className="payment-icon">{payment.icon}</span><span><b>{payment.label}</b><small>{payment.detail}</small></span><span className="arrow">+</span></button>)}</div><button className="refund-button" disabled={!balance} onClick={refund}>Return current balance <span>{money(balance)}</span></button></div>
        </div>

        <aside className="right-column">
          <div className="panel output-panel"><div className="panel-heading compact"><div><span className="section-label">03 / MACHINE OUTPUT</span><h2>Live response</h2></div><span className={`state-pill ${stateMeta.tone}`}>{machineState}</span></div><div className="output-message"><span className="output-symbol">{machineState === 'Dispensing' ? '↓' : machineState === 'Refunding' ? '↩' : machineState === 'OutOfStock' ? '!' : '↗'}</span><p>{message}</p></div><div className="progress-label"><span>PAYMENT PROGRESS</span><strong>{selected ? `${Math.round(paidPercent)}%` : '—'}</strong></div><div className="progress-track"><i style={{ width: `${paidPercent}%` }} /></div><div className="machine-readout"><span>SELECTED</span><b>{selected?.name ?? '—'}</b><span>PRICE</span><b>{selected ? money(selected.price) : '—'}</b></div></div>
          <div className="panel trace-panel"><div className="panel-heading compact"><div><span className="section-label">04 / TRANSITION LOG</span><h2>Mealy trace</h2></div><span className="trace-count">{traces.length} events</span></div>{traces.length === 0 ? <div className="empty-trace">Your input/output pairs will appear here.</div> : <div className="trace-list">{traces.map((trace, index) => <div className="trace-row" key={`${trace.time}-${index}`}><span className="trace-time">{trace.time}</span><span className="trace-transition"><b>{trace.from}</b><i>— {trace.input} / {trace.output} →</i><b>{trace.to}</b></span></div>)}</div>}</div>
        </aside>
      </section>

      <footer><span>δ(state, input) → next state</span><span>λ(state, input) → output</span><span className="footer-note">Inventory synchronized · {stockUnits} units in system</span></footer>
      <section className="transition-section"><div className="section-label">05 / FORMAL TRANSITION TABLE</div><h2>δ and λ functions at a glance</h2><div className="transition-table"><div className="transition-head"><span>Current state</span><span>Input</span><span>Output</span><span>Next state</span></div>{transitionRows.map((row) => <div className="transition-row" key={`${row.state}-${row.input}`}><b>{row.state}</b><span>{row.input}</span><span>{row.output}</span><b>{row.next}</b></div>)}</div></section>
    </main>
  )
}

export default App
