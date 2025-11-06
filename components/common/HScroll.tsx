import clsx from 'clsx';
import * as React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;
export default function HScroll({ className, ...rest }: Props) {
  return (
    <div
      className={clsx(
        'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4',
        '[&>*]:snap-start [&>*]:shrink-0 [&>*]:basis-40',
        className
      )}
      {...rest}
    />
  );
}
