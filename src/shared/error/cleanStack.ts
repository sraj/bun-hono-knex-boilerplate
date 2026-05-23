const cleanStack = (stack: string | undefined, maxLines = 5): string => {
  if (!stack) return '';

  return stack
    .split('\n')
    .filter((line) => !line.includes('node:internal'))
    .slice(0, maxLines)
    .join('\n');
};

export default cleanStack;
