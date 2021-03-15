import axios from 'axios'
import router from '@/router'
import { message } from 'ant-design-vue'

message.config({
  top: '50px'
})
let instance = axios.create({
  baseURL: window.localStorage.getItem('apiUrl') || '',
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
})

instance.interceptors.request.use(request => {
  request.baseURL = window.localStorage.getItem('apiUrl') || request.baseURL
  request.headers['X-Auth-Token'] = localStorage.getItem('X-Auth-Token')
  return request
})

instance.interceptors.response.use(response => {
  if (response && response.data) {
    let data = response.data

    if (data.code === 401) {
      router.push('/login')
      return Promise.reject(response)
    } else if (data.code !== 1 && data.message) {
      message.error(data.message)
      return Promise.reject(response)
    }
  }
  return response.data
}, error => {
  if (error.response !== undefined && error.response.status === 401) {
    router.push('/login')
  }
  if (error.response !== undefined) {
    message.error(error.response.data.message);
  }
  return Promise.reject(error.response)
})

export default instance