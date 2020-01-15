import { Command, format, HelpError, Dictionary, getSchemaPath } from '@prisma/cli'
import chalk from 'chalk'
import { missingGeneratorMessage } from '@prisma/lift'
import { getGenerators } from '@prisma/sdk'
import { formatms } from './utils/formatms'
import path from 'path'
const pkg = eval(`require('../package.json')`)

/**
 * $ prisma migrate new
 */
export class Generate implements Command {
  public static new(): Generate {
    return new Generate()
  }

  // static help template
  private static help = format(`
    Generate the Photon Client.

    ${chalk.bold('Usage')}

      prisma2 generate 

  `)
  private constructor() {}

  // parse arguments
  public async parse(argv: string[], minimalOutput = false): Promise<string | Error> {
    const datamodelPath = await getSchemaPath()
    if (!datamodelPath) {
      throw new Error(`Can't find schema.prisma`) // TODO: Add this into a central place in getSchemaPath() as an arg
    }
    const generators = await getGenerators({
      schemaPath: datamodelPath,
      printDownloadProgress: true,
      version: pkg.prisma.version,
      cliVersion: pkg.version,
    })

    if (generators.length === 0) {
      console.log(missingGeneratorMessage)
    }

    for (const generator of generators) {
      const toStr = generator.options!.generator.output!
        ? chalk.dim(` to .${path.sep}${path.relative(process.cwd(), generator.options!.generator.output!)}`)
        : ''
      const name = generator.manifest ? generator.manifest.prettyName : generator.options!.generator.provider
      if (
        generator.manifest?.version &&
        generator.manifest?.version !== pkg.version &&
        generator.options?.generator.provider === 'prisma-client-js'
      ) {
        console.error(
          `${chalk.bold(`@prisma/client@${generator.manifest?.version}`)} is not compatible with ${chalk.bold(
            `prisma2@${pkg.version}`,
          )}. Their versions need to be equal.`,
        )
      }
      console.log(`Generating ${chalk.bold(name!)}${toStr}`)
      const before = Date.now()
      await generator.generate()
      generator.stop()
      const after = Date.now()
      console.log(`Done in ${formatms(after - before)}`)
    }

    return ''
  }

  // help message
  public help(error?: string): string | HelpError {
    if (error) {
      return new HelpError(`\n${chalk.bold.red(`!`)} ${error}\n${Generate.help}`)
    }
    return Generate.help
  }
}
