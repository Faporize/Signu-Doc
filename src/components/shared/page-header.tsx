import type { ReactNode } from "react";

type PageHeaderProps = {
  action?: ReactNode;
  /**
   * On a phone, put a short action beside the title. Left out, the action
   * sits under the line about the page, where a long label has room.
   */
  inlineAction?: boolean;
  description?: string;
  title: string;
};

/**
 * The white card that opens a page: its title, one line about it, one action.
 * On a phone the action sits beside the title and the line runs underneath,
 * so the page's content starts higher up.
 */
export function PageHeader({
  action,
  description,
  inlineAction = false,
  title,
}: PageHeaderProps) {
  return (
    <div
      className="panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-4 sm:gap-x-6 sm:px-8 sm:py-7"
      data-animate="enter"
    >
      <h1 className="col-start-1 row-start-1 min-w-0 text-[clamp(1.625rem,3vw,2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-(--fg)">
        {title}
      </h1>
      {description ? (
        <p className="col-span-2 row-start-2 max-w-2xl text-sm leading-5 text-(--secondary) sm:col-span-1 sm:text-[0.9375rem] sm:leading-6">
          {description}
        </p>
      ) : null}
      {action ? (
        <div
          className={
            inlineAction
              ? "col-start-2 row-start-1 shrink-0 sm:row-span-2"
              : "col-span-2 row-start-3 mt-1.5 sm:col-span-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0"
          }
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}
