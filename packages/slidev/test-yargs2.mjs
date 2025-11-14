import yargs from 'yargs';
import prompts from 'prompts';

yargs(process.argv.slice(2))
  .command(
    'test',
    'Test command',
    () => {},
    async () => {
      console.log('Running test command');
      const result = await prompts({
        name: 'confirm',
        type: 'confirm',
        message: 'Continue?',
      });
      console.log('Got result:', result);
      if (result.confirm === undefined) {
        console.log('Cancelled!');
        process.exit(1);
      }
    }
  )
  .parse();
