import prompts from 'prompts';

console.log('About to call prompts with onCancel...');
const result = await prompts({
  name: 'confirm',
  initial: 'Y',
  type: 'confirm',
  message: 'Do you want to continue?',
}, {
  onCancel: () => {
    console.log('onCancel called!');
    process.exit(1);
  },
});

console.log('Prompts returned:', JSON.stringify(result));
process.exit(0);
