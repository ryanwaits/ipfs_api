import React, { useEffect, useState } from 'react'
import { Redirect } from 'react-router-dom'
import styled from 'styled-components'
import { Col, Grid, Row } from 'react-styled-flexboxgrid'
import ReactMarkdown from 'react-markdown'
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { monokai } from 'react-syntax-highlighter/dist/esm/styles/hljs'

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`

const Input = styled.input`
  letter-spacing: 0.5px;
  font-size: 14px;
  padding: 0 1.5rem;
  border: none;
  background: rgba(40, 40, 40, 0.25);
  color: rgba(255, 255, 255, 0.9);
  height: 3rem;
  width: 100%;
  margin: 1.5rem auto;
  border-radius: 4px 0px 0px 4px;
`

const Button = styled.button`
  padding: 0.5rem 1.25rem;
  margin: 0.5rem 0;
  border: none;
  background-color: rgba(40, 40, 40, 0.25);
  color: #fff;
  font-size: 1rem;
  font-family: -apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.1s;
  width: auto;
  outline: none;
`

const Box = styled.div`
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  color: #4f566b;
  font-family: -apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  font-size: 14px;
  margin-bottom: 32px;
  margin-left: 0;
  max-width: 600px;
  overflow-wrap: break-word;
  word-wrap: break-word;
`

function Login({history}) {
  const [state, setState] = useState({username: "", password: ""})

  function handleInput(e) {
    let value = e.target.value
    setState({ ...state, [e.target.name]: value })
  }

  async function handleLogin() {
    const response = await fetch(`http://localhost:9000/login`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: state.username,
        password: state.password
      })
    });
    const user = await response.json()
    if (user.statusCode === 200) {
      localStorage.setItem("loggedIn", true)
      history.push("/dashboard")
    }
  }

  return (
    <Grid >
      <Row>
        <Col lg={12} style={{height: "100vh", display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{textAlign: "center", width: "50%", margin: "2.5rem auto 2.5rem auto"}}>
            <Box style={{width: "75%", margin: "0 auto"}}>
              <p style={{fontSize: "18px", lineHeight: "30px"}}>Login to manage your keys and make requests to the IPFS API.</p>
            </Box>
            <Input placeholder={`admin`} type="text" name="username" onChange={handleInput}/>
            <Input placeholder={`12345`} type="password" name="password" onChange={handleInput} />
            <Button onClick={handleLogin}>Login</Button>
          </div>
        </Col>
      </Row>
    </Grid>
  )
}

export default Login