import { CopyButton } from '../Common/CopyButton';
import type { AppError } from '../../lib/errors/classify';

interface CopyDetailsButtonProps {
  error: AppError;
}

export function CopyDetailsButton({ error }: CopyDetailsButtonProps) {
  const getText = () =>
    [
      '[Skillset error]',
      `source: ${error.source}`,
      `category: ${error.category}`,
      `title: ${error.title}`,
      `message: ${error.message}`,
      `when: ${new Date().toISOString()}`,
      '---',
      error.details,
    ].join('\n');

  return <CopyButton getText={getText} size={12} title="Copy error details" />;
}
