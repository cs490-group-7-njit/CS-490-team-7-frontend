import { post } from './http'

export async function loginVendor({ email, password }) {
  return post('/auth/login', { email, password })
}
