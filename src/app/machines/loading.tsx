import { Bone, LoadingFrame } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Loading machines">
      <div className="border-b border-line bg-paper-2">
        <div className="wrap py-6">
          <Bone className="h-3 w-32" />
          <Bone className="mt-3 h-8 w-96 max-w-full" />
          <Bone className="mt-3 h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="wrap grid gap-6 py-6 lg:grid-cols-[272px_minmax(0,1fr)]">
        <div className="hidden border border-line p-4 lg:block">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-b border-line py-4 first:pt-0 last:border-b-0">
              <Bone className="h-3 w-24" />
              <Bone className="mt-3 h-3 w-40" />
              <Bone className="mt-2 h-3 w-32" />
              <Bone className="mt-2 h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="min-w-0">
          <div className="flex justify-between border-b border-line pb-3">
            <Bone className="h-4 w-36" />
            <Bone className="h-8 w-44" />
          </div>
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-[104px_1fr] border border-line sm:grid-cols-[208px_1fr]">
                <Bone className="min-h-[104px] border-r border-line sm:min-h-[156px]" />
                <div className="p-4">
                  <Bone className="h-3 w-28" />
                  <Bone className="mt-3 h-4 w-3/4" />
                  <Bone className="mt-4 h-3 w-1/2" />
                  <Bone className="mt-3 h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
}
