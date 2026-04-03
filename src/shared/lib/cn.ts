import clsx from 'clsx';

export const cn = (...values: Parameters<typeof clsx>) => clsx(...values);
