import { Bone, LoadingFrame } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingFrame>
      <div className="border-b border-line bg-paper-2">
        <div className="wrap py-8">
          <Bone className="h-3 w-28" />
          <Bone className="mt-3 h-8 w-80 max-w-full" />
          <Bone className="mt-3 h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="wrap space-y-3 py-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-line p-5">
            <Bone className="h-4 w-1/3" />
            <Bone className="mt-3 h-3 w-2/3" />
            <Bone className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </LoadingFrame>
  );
}
