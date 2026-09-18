import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </main>
  );
}
