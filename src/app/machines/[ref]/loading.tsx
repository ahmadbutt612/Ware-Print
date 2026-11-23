import { Bone, LoadingFrame } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingFrame label="Loading machine">
      <div className="wrap pt-5 pb-10">
        <Bone className="h-3 w-56" />
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <Bone className="h-8 w-4/5" />
            <Bone className="mt-3 h-4 w-1/2" />
            <Bone className="mt-5 aspect-[4/3] w-full border border-line" />
            <div className="mt-2 flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} className="h-[60px] w-20" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="border border-line p-5">
              <Bone className="h-7 w-44" />
              <Bone className="mt-2 h-3 w-28" />
              <Bone className="mt-5 h-12 w-full" />
            </div>
            <div className="border border-line">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-[42%_1fr] border-b border-line last:border-b-0">
                  <div className="bg-paper-2 px-3 py-3">
                    <Bone className="h-3 w-20" />
                  </div>
                  <div className="px-3 py-3">
                    <Bone className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
}
