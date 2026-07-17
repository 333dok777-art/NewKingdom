import { createBrowserRouter } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import Register from '../pages/Register.jsx'
import Game from '../pages/Game.jsx'
import NotFound from '../pages/NotFound.jsx'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/game', element: <Game /> },
  { path: '*', element: <NotFound /> },
])
