// /components/dataroom/FolderTree.tsx
import { Folder, ChevronRight, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FolderTree({ folders, activeFolder, onSelect }: { folders: string[], activeFolder: string, onSelect: (folder: string) => void }) {
  return (
    <ul className="space-y-1">
      {folders.map(folder => {
        const isActive = activeFolder === folder
        return (
          <li key={folder}>
            <button 
              onClick={() => onSelect(folder)}
              className={cn(
                "w-full flex items-center p-2 text-sm rounded-md transition-colors",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400 font-medium" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                {isActive ? <FolderOpen className="w-4 h-4 text-emerald-500" /> : <Folder className="w-4 h-4 shrink-0" />}
                <span className="truncate">{folder}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
