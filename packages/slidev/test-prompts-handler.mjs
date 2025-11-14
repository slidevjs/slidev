process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('exit', (code) => {
  console.error('Process exiting with code:', code);
});

import prompts from 'prompts';

console.log('About to call prompts...');
try {
  const result = await prompts({
    name: 'confirm',
    initial: 'Y',
    type: 'confirm',
    message: 'Do you want to continue?',
  });

  console.log('Prompts returned:', JSON.stringify(result));
  console.log('confirm:', result.confirm);
  
  if (result.confirm === undefined) {
    console.log('Cancelled');
    process.exit(1);
  }
} catch (err) {
  console.error('Caught error:', err);
  process.exit(1);
}

console.log('Should not reach here');
