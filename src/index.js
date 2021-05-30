import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Switch } from 'react-router-dom'
import './index.css'
import App from './client/App'
import Login from './client/Login'
import reportWebVitals from './client/reportWebVitals'

import { OpenRoute, ProtectedRoute, PublicRoute } from './routes'

ReactDOM.render(
  <React.StrictMode>
  <Router>
  <Switch>
    <PublicRoute exact path={`/`} component={ Login } />
    <ProtectedRoute path='/dashboard' component={ App } />
  </Switch>
  </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

reportWebVitals();
