import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

function cleanStdout (stdout) {
  return stdout
    .trim()
    .split('\n')
    .map(line => line.split(' ').at(-1))
    .filter(Boolean)
}

export async function getGitStatus () {
  const { stdout } = await execAsync('git status --untracked-files --porcelain')
  return cleanStdout(stdout)
}

export async function getStagedFiles () {
  const { stdout } = await execAsync('git diff --cached --name-only')
  return cleanStdout(stdout)
}

export async function gitCommit ({ commit } = {}) {
  const { stdout } = await execAsync(`git commit -m "${commit}"`)
  return cleanStdout(stdout)
}

export async function gitAdd ({ files = [] } = {}) {
  const filesLine = files.join(' ')
  const { stdout } = await execAsync(`git add ${filesLine}`)
  return cleanStdout(stdout)
}

export async function gitDiscardCommits ({ files = [] } = {}) {
  return files.map(async (file) => await execAsync(`git reset HEAD ${file}`))
}
