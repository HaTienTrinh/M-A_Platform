const fs = require('fs');
const file = 'c:/Users/ADMIN/Downloads/dealflow-m&a-platform/app/deals/[id]/dataroom/DataRoomClient.tsx';
let content = fs.readFileSync(file, 'utf8');
const target = `<Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={(e) => {
                                           e.stopPropagation()
                                           handleDownload(file)
                                        }}><Download className="w-4 h-4" /></Button>`;
const replacement = `{canDownload(file) && ( <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={(e) => { e.stopPropagation(); handleDownload(file); }}><Download className="w-4 h-4" /></Button> )}`;
content = content.replace(target, replacement);
fs.writeFileSync(file, content);
