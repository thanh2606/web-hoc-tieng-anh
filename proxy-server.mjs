// Proxy server entry point
import 'dotenv/config'
import { startProxyServer } from './proxy/index.mjs'

const PORT = process.env.PROXY_PORT || 3333
startProxyServer(PORT)