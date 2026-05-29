interface LeftSidebarProps {
  resources: File[];
  onViewFile: (file: File) => void;
  onRemoveFile: (name: string) => void;
  onUploadClick: () => void;
}

const getIcon = (name: string) => {
  if (name.endsWith(".pdf")) return "picture_as_pdf";
  if (name.endsWith(".md")) return "article";
  if (name.endsWith(".json")) return "data_object";
  if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
  if (name.endsWith(".txt")) return "sticky_note_2";
  return "draft";
};

export default function LeftSidebar({
  resources,
  onViewFile,
  onRemoveFile,
  onUploadClick,
}: LeftSidebarProps) {
  return (
    <div className="pt-14 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Resources
        </h2>
        <span className="material-symbols-outlined text-on-surface-variant text-sm">
          folder_open
        </span>
      </div>

      <div className="space-y-1 custom-scrollbar-transparent overflow-y-auto flex-1">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 opacity-40">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">
              folder_open
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant text-center text-sm">
              No resources yet.
              <br />
              Upload files to get started.
            </p>
          </div>
        ) : (
          resources.map((item) => (
            <div
              key={item.name}
              onClick={() => onViewFile(item)}
              className="flex items-center gap-2 py-1 px-2 hover:bg-surface-container-high transition-all cursor-pointer rounded-lg border-b border-on-secondary-container/5 group"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary transition-colors">
                {getIcon(item.name)}
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface truncate flex-1">
                {item.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(item.name);
                }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                  close
                </span>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-outline-variant">
        <button
          onClick={onUploadClick}
          className="flex items-center justify-center gap-1 w-full py-2 bg-secondary-container text-on-secondary-container rounded-xl font-label-md text-label-md hover:bg-surface-container-high transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Upload Context
        </button>
      </div>
    </div>
  );
}