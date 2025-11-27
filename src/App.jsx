import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        {/* <Route path="/counter" element={<Counter />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
