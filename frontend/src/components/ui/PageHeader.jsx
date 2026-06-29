const PageHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  backButton,
  actions,
  meta,
}) => {
  return (
    <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {backButton}

        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/15 text-blue-400">
            <Icon />
          </div>
        )}

        <div className="min-w-0">
          {eyebrow && (
            <p className="text-sm font-medium text-red-400">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-1 text-3xl font-bold text-white">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-gray-400">
              {description}
            </p>
          )}

          {meta && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {meta}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
