import noRelativeToNavigation from './rules/no-relative-to-navigation';
import noTrailingSlashNavigation from './rules/no-trailing-slash-navigation';

export const rules = {
  'no-relative-to-navigation': noRelativeToNavigation,
  'no-trailing-slash-navigation': noTrailingSlashNavigation,
};

export default { rules };

