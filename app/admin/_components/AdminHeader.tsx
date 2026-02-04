import AdminHeaderClient from './AdminHeaderClient.client'
import { getAdminEnv, getShortCommit } from './adminEnv'

export default function AdminHeader() {
  const { env, label } = getAdminEnv()
  const commit = getShortCommit()
  return <AdminHeaderClient env={env} label={label} commit={commit} />
}
