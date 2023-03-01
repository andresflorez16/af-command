import {
  intro,
  outro,
  text,
  select,
  confirm,
  multiselect,
  isCancel
} from '@clack/prompts'
import { COMMIT_TYPES } from './commit-types.js'
import colors from 'picocolors'
import {
  getGitStatus,
  getStagedFiles,
  gitAdd,
  gitCommit,
  gitDiscardCommits
} from './git.js'
import { trytm } from '@bdsqqq/try'

const [changedFiles, errorsChangedFiles] = await trytm(getGitStatus())
const [stagedFiles, errorsStagedFiles] = await trytm(getStagedFiles())

intro(
  '🤖 ' + `Welcome back ${colors.yellow('Andrés')}`
)

if (errorsChangedFiles ?? errorsStagedFiles) {
  outro('❌ ' + colors.red('Err: Verify the reporitory'))
  process.exit(1)
}

let files
if (stagedFiles.length === 0 && changedFiles.length > 0) {
  files = await multiselect({
    message: colors.yellow('Not staged files. Select the files you want to stage:'),
    options: changedFiles.map(file => ({
      value: file,
      label: file
    }))
  })

  if (isCancel(files)) {
    outro(colors.red('❌ Not commits'))
    process.exit(0)
  }
  await gitAdd({ files })
}

const commitType = await select({
  message: colors.yellow('What type of commit are you doing?'),
  options: Object.entries(COMMIT_TYPES).map(([key, value]) => ({
    value: key,
    label: `${value.emoji} [${colors.yellow(key.padEnd(8, ' '))}] > ${value.description}`
  }))
})

if (isCancel(commitType)) {
  outro(colors.red('❌ Commit canceled'))
  if (files) await gitDiscardCommits({ files })
  process.exit(0)
}

const commitMsg = await text({
  message: colors.yellow('What is the commit message?'),
  placeholder: 'Add login component',
  validate: (msg) => {
    if (!msg) {
      return colors.red('Commit message is required')
    }

    if (msg.length > 50) {
      return colors.red('❌ Commit message must be at least 50 characters long')
    }

    if (Number(msg)) {
      return colors.red('❌ Commit message must be a string')
    }
  }
})

if (isCancel(commitMsg)) {
  outro(colors.red('❌ Commit canceled'))
  if (files) await gitDiscardCommits({ files })
  process.exit(0)
}

const { emoji } = COMMIT_TYPES[commitType]

const commit = `${emoji}: ${commitMsg}`

const confirmCommit = await confirm({
  initialValue: true,
  message: colors.yellow(`Are you sure you want to commit?
   ${colors.cyan(commit)}
  `)
})

if (!confirmCommit) {
  outro(colors.red('❌ Commit canceled'))
  await gitDiscardCommits({ files })
  process.exit(0)
}

await gitCommit({ commit })

outro(
  '✅ Commit created.See you soon! 👋'
)
