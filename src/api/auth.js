import { post } from './http'

export async function loginUser({ email, password }) {
  return post('/auth/login', { email, password })
}

export async function registerUser({ name, email, password, role, phone }) {
  return post('/auth/register', { name, email, password, role, phone })
}

export async function loginVendor({ email, password }) {
  return loginUser({ email, password })
}
