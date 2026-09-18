import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-48 self-center" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </main>
  );
}
