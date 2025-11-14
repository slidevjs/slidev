import prompts from 'prompts';

console.log('About to call prompts...');
const result = await prompts({
  name: 'confirm',
  initial: 'Y',
  type: 'confirm',
  message: 'Do you want to continue?',
});

console.log('Result type:', typeof result);
console.log('Result:', JSON.stringify(result));
console.log('Result.confirm:', result.confirm);
console.log('result.confirm === undefined:', result.confirm === undefined);

if (result.confirm === undefined) {
  console.log('Prompt was cancelled');
  process.exit(1);
}

if (!result.confirm) {
  console.log('User declined');
  process.exit(1);
}

console.log('User confirmed!');
