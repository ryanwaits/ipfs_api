import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Col, Grid, Row } from 'react-styled-flexboxgrid'

import ReactMarkdown from 'react-markdown'
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { monokai } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { ToastContainer, toast } from 'react-toastify'
import { Modal } from "react-responsive-modal"
import moment from 'moment'

import 'react-toastify/dist/ReactToastify.css'
import "react-responsive-modal/styles.css"

const InputButton = styled.input`
  letter-spacing: 0.5px;
  font-size: 14px;
  padding: 0 1.5rem;
  border: none;
  background: rgba(40, 40, 40, 0.35);
  color: rgba(255, 255, 255, 0.9);
  height: 3rem;
  width: 100%;
  border-radius: 4px 0px 0px 4px;
`

const Heading = styled.h1`
  -webkit-font-smoothing: antialiased;
  align-items: center;
  box-sizing: border-box;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  font-family: -apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  font-size: 24px;
  font-weight: 500;
  line-height: 40px;
  margin: 0;
  overflow-wrap: break-word;
  padding: 0;
  word-wrap: break-word;
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

const BoxHeader = styled.div`
  -webkit-font-smoothing: antialiased;
  align-items: center;
  background: rgb(39, 40, 34);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  box-sizing: border-box;
  color: #4f566b;
  display: flex;
  font-family: -apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  font-size: 14px;
  justify-content: space-between;
  overflow-wrap: break-word;
  width: 100%;
  word-wrap: break-word;
  height: 2rem;
  margin: 1.5rem 0 0 0;
`

const BoxTitle = styled.div`
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  color: #a3acb9;
  font-family: -apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  font-size: 12px;
  font-weight: 500;
  overflow-wrap: break-word;
  padding-left: 12px;
  pointer-events: none;
  text-transform: uppercase;
  user-select: none;
  word-wrap: break-word;
`

function App({history}) {
  const [state, setState] = useState({
    loading: true,
    user: {username: "admin"},
    request: {url: "", status: ""}, 
    apiKeys: [],
    apiKey: {},
    requests: [],
    open: false
  })
  useEffect(async () => {
    fetchKeys(1) // TODO: get userID
  }, [])

  function handleRequestInput(e) {
    setState({...state, request: { url: e.target.value } })
  }

  async function createNewAPIKey() {
    try {
      const response = await fetch(`http://localhost:9000/users/1/keys`, { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })
      const data = await response.json()
      setState({...state, apiKey: data, apiKeys: [...state.apiKeys.concat(data)]})
      toast.dark("⚡️ New API Key Generated", {
        toastId: '1'
      })
    } catch (error) {
      console.log(error)
    }
  }

  async function handleIpfsRequest(e) {
    if (e.key === "Enter") {
      try {
        const response = await fetch(`http://localhost:9000/ipfs/${state.request.url}`, { 
          method: "POST", 
          headers: {
            "Authorization": state.apiKey.token,
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        })
        if (response.status === 200) {
          const data = await response.json()
          toast.dark("✅ Request Successful", {
            toastId: '1'
          })
        } else {
          toast.dark("❌ Unauthorized API Key", {
            toastId: '1'
          })
        }
        const res = await fetch(`http://localhost:9000/requests`);
        const requests = await res.json()
        setState({...state, request: { url: state.request.url, status: response.status }, requests: requests.data})
      } catch (error) {
        console.log(error)
      }
    }
  }

  async function fetchKeys(userId) {
    const response = await fetch(`http://localhost:9000/users/${userId}/keys`);
    const apiKeys = await response.json()
    const res = await fetch(`http://localhost:9000/requests`);
    const requests = await res.json()
    setState({...state, loading: false, apiKeys: apiKeys, apiKey: apiKeys[0], requests: requests.data})
  }

  async function selectKey(key) {
    setState({...state, apiKey: key, open: false})
    toast.dark(`⚡️ Current API Key Changed`, {
      toastId: '1'
    })
  }

  function handleLogout() {
    localStorage.removeItem("loggedIn")
    history.push("/")
  }

  const formattedData = () => {
    return state?.apiKeys?.map((key) => {
      return {
        token: key.token,
        date: new Date(key.createdAt).toString(),
        permission: "ALL",
        status: <button>{key.active ? `Revoke` : `Enable`}</button>
      }
    })
  }

  const codeString = `
    await fetch(${state.request.url ? state.request.url : "URL"}, { 
      method: "POST", 
      headers: {
        "Authorization": "${state.apiKey.token}", 
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })
  `
  const codeResponse = `
    ${state.request.status ? `{ "statusCode": ${state.request.status} }` : `{}`}
  `

  let string = ``
  state.requests.forEach(request => string = string + `\n ⏱ ${moment().calendar(request.updatedAt)}: ${request.message}`)
  
  if (state.loading) {
    return <div>Loading...</div>
  }

  return (
    <Grid >
      <ToastContainer newestOnTop position={`top-center`} autoClose={2500}/>
      <Modal 
        open={state.open} 
        showCloseIcon={false}
        center 
        onClose={() => setState({...state, open: false})}
      >
        <Row>
          <Col lg={12} style={{padding: "0.5rem 1rem", width: "350px", textAlign: "center"}}>
            <h2>Select an API Key</h2>
            { state.apiKeys.map((key) => {
              return <p key={key.id} onClick={() => selectKey(key)} style={{cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontSize: "14px", fontWeight: "bold", letterSpacing: "1px", margin: "0.5rem auto"}}>{key.id === state.apiKey.id ? `⚡️ ${key.token}` : key.token}</p>
            })}
          </Col>
        </Row>
      </Modal>
      <Row>
        <Col lg={12}>
          <section style={{height: "10vh", margin: "2.5rem auto", color: "#fff", display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "0.5rem 2.5rem"}}>
            <p style={{display: "flex", alignItems: "center", padding: "1rem", fontSize: "14px", fontWeight: "bold", letterSpacing: "1px"}}>Active API Key</p>
            <p onClick={() => setState({...state, open: true})}style={{cursor: "pointer", display: "flex", alignItems: "center", width: "auto", height: "3rem", marginRight: "1rem", borderRadius: "15px", background: "rgba(255, 255, 255, 0.075)", padding: "0.5rem 1.5rem", fontSize: "14px", fontWeight: "bold", letterSpacing: "1px"}}>{state.apiKey.token}</p>
            <p onClick={createNewAPIKey} style={{cursor: "pointer", display: "flex", alignItems: "center", padding: "1rem", fontSize: "14px", fontWeight: "bold", letterSpacing: "1px", position: "relative", left: "300px"}}>⚡️ Generate New API Key</p>
            <p onClick={handleLogout}style={{display: "flex", alignItems: "center", cursor: "pointer", padding: "1rem", fontSize: "14px", fontWeight: "bold", letterSpacing: "1px", position: "relative", left: "325px"}}>Logout</p>
          </section>
        </Col>
      </Row>
      <Row>
        <Col lg={12}>
          <div style={{textAlign: "center", width: "50%", margin: "2.5rem auto 2.5rem auto"}}>
            <Box>
              <p style={{fontSize: "18px", lineHeight: "30px"}}>Make secure calls to IPFS with your custom API keys and view your request logs below.</p>
              <a style={{color: "#fff"}} href="https://docs.ipfs.io/reference/http/api/" target="_blank">https://docs.ipfs.io/reference/http/api/</a>
            </Box>
            <InputButton onKeyPress={handleIpfsRequest} onInput={handleRequestInput} placeholder={`Type IPFS Endpoint Here`} value={state.request.url}/>
          </div>
        </Col>
      </Row>
      <Row style={{margin: "5rem auto"}}>
      <Col lg={5} lgOffset={1}>
        <div>
          <Heading>Requests</Heading>
          <Box>
            <p style={{fontSize: "18px", lineHeight: "35px"}}>Browse the IPFS API documentation for a list of endpoints to test out using using your API key.</p>
            <p style={{fontSize: "18px", lineHeight: "35px"}}>Select your API Key  at the top of the page to toggle between API keys. All old keys get revoked when you generate new ones.</p>
          </Box>
        </div>
       </Col>
       <Col lg={5} lgOffset={1}>
          <div>
            <Box>
              <BoxHeader>
                <BoxTitle>API Call</BoxTitle>
              </BoxHeader>
              <SyntaxHighlighter language="javascript" style={monokai}>
                  {codeString}
              </SyntaxHighlighter>
            </Box>
            <Box>
              <BoxHeader>
                <BoxTitle>Response</BoxTitle>
              </BoxHeader>
              <SyntaxHighlighter language="javascript" style={monokai}>
                  {codeResponse}
              </SyntaxHighlighter>
            </Box>
          </div>
         </Col>
      </Row>
      <Row style={{margin: "5rem auto"}}>
       <Col >
            <Box style={{minWidth: "1100px"}}>
              <BoxHeader>
                <BoxTitle>Activity Logs</BoxTitle>
              </BoxHeader>
              <SyntaxHighlighter language="bash" style={monokai}>
                  { state.requests.length > 0 ? string : `\n Logs will appear once you start making requests\n` }
              </SyntaxHighlighter>
            </Box>
         </Col>
      </Row>
    </Grid>
  )
}

export default App