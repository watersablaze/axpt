// src/components/case/ItemRow.tsx

import { UploadButton } from './UploadButton';

type Props = {
  item: {
    id: string;
    description: string;
    status: string;
    artifacts?: {
      id: string;
      name: string;
    }[];
  };
  allowUpload?: boolean;
  disabled?: boolean;
};

export function ItemRow({ item, allowUpload, disabled = false }: Props) {
  const artifacts = item.artifacts ?? [];

  return (
    <div className="border border-white/10 rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">{item.description}</span>

        <span className="text-xs text-white/50">
          {item.status}
        </span>
      </div>

      {artifacts.length > 0 && (
        <div className="text-xs space-y-1 text-white/70">
          {artifacts.map((a: any) => (
            <a key={a.id} href={`/api/axpt/artifacts/${a.id}/download`} className="underline">
              {a.name}
            </a>
          ))}
        </div>
      )}

      {allowUpload && !disabled && (
        <UploadButton itemId={item.id} />
      )}
    </div>
  );
}
