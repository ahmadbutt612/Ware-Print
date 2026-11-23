import { Bone, LoadingFrame } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingFrame>
      <div className="border-b border-line pb-5">
        <Bone className="h-3 w-24" />
        <Bone className="mt-3 h-7 w-72 max-w-full" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-paper p-4">
            <Bone className="h-3 w-20" />
            <Bone className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-8 divide-y divide-line border border-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Bone className="h-3 w-16" />
            <Bone className="h-3 flex-1" />
            <Bone className="h-5 w-20" />
          </div>
        ))}
      </div>
    </LoadingFrame>
  );
}
