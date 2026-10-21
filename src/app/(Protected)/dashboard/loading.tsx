export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    </div>
  );
}
