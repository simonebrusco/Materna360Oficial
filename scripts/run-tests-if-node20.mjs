#!/usr/bin/env node
const major = Number(process.versions.node.split('.')[0])
if (Number.isNaN(major) || major < 20) {
  console.log(`[tests] Skipped: running on ${process.version}. Tests require Node >=20.`)
  process.exit(0)
}

import('child_process').then(({ spawn }) => {
  const child = spawn('npx', ['vitest', 'run'], { stdio: 'inherit', shell: true })
  child.on('exit', (code) => process.exit(code))
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
