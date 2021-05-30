import React from 'react'

// Routing
import { Route, Redirect } from 'react-router-dom'

export const OpenRoute = ({ component: Component, ...rest }) => (
  <Route { ...rest } render={(props) => ( <Component { ...props } /> )} />
)

export const PublicRoute = ({ component: Component, ...rest }) => (
  <Route { ...rest } render={(props) => (
      localStorage.getItem("loggedIn")
      ? <Redirect to={`/dashboard`} />
      : <Component { ...props } />
  )} />
)

export const ProtectedRoute = ({ component: Component, ...rest }) => (
  <Route { ...rest } render={(props) => (
      localStorage.getItem("loggedIn")
      ? <Component { ...props } />
      : <Redirect to={{
          pathname: '/'
        }} />
  )} />
)