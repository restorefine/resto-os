interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tabs?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action, tabs }: PageHeaderProps) {
  return (
    <div className="mb-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-2 shrink-0">{action}</div>
        )}
      </div>
      {tabs && <div className="mt-5">{tabs}</div>}
    </div>
  );
}
