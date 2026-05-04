'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Send, FileText, Bot, User as UserIcon, Paperclip, Download, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'

type Participant = {
  id: string
  label: string
}

type RelatedUser = {
  id: string
  full_name?: string | null
  email?: string | null
}

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

interface Props {
  dealId: string;
  dealTitle: string;
  userId: string;
  partnerId: string;
  partnerName: string;
  isSeller: boolean;
}

export function ChatThread({ dealId, dealTitle, userId, partnerId, partnerName, isSeller }: Props) {
  const supabase = createSupabaseClient()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [suggestionItems, setSuggestionItems] = useState<Participant[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch participants for @mentions
  const fetchParticipants = useCallback(async () => {
    try {
      // 1. Get Deal Seller
      const { data: deal } = await supabase.from('deals').select('seller_id, users!seller_id(id, full_name, email)').eq('id', dealId).single()
      
      // 2. Get Approved Buyers
      const { data: ndas } = await supabase.from('nda_requests').select('buyer_id, users!buyer_id(id, full_name, email)').eq('deal_id', dealId).eq('status', 'approved')
      
      // 3. Get Advisors (Simplified: anyone with role advisor for now)
      const { data: advisors } = await supabase.from('users').select('id, full_name, email').eq('role', 'advisor')

      const combined = new Map<string, Participant>()
      const seller = firstRelated(deal?.users as RelatedUser | RelatedUser[] | null)
      if (seller) combined.set(seller.id, { id: seller.id, label: seller.full_name || seller.email || 'Seller' })
      ndas?.forEach(n => {
        const buyer = firstRelated(n.users as RelatedUser | RelatedUser[] | null)
        if (buyer) combined.set(buyer.id, { id: buyer.id, label: buyer.full_name || buyer.email || 'Buyer' })
      })
      advisors?.forEach(a => {
        combined.set(a.id, { id: a.id, label: a.full_name || a.email || 'Advisor' })
      })
      
      setParticipants(Array.from(combined.values()))
    } catch (err) {
      console.error('Error fetching participants:', err)
    }
  }, [dealId, supabase])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded',
        },
        suggestion: {
          items: ({ query }) => participants
            .filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8),
          command: ({ editor, range, props }) => {
            editor.chain().focus().insertContentAt(range, [
              { type: 'mention', attrs: props },
              { type: 'text', text: ' ' },
            ]).run()
          },
          render: () => ({
            onStart: props => {
              setShowSuggestions(true)
              setSuggestionQuery(props.query)
              setSuggestionItems(props.items as Participant[])
              setSuggestionIndex(0)
            },
            onUpdate: props => {
              setSuggestionQuery(props.query)
              setSuggestionItems(props.items as Participant[])
              setSuggestionIndex(0)
            },
            onExit: () => {
              setShowSuggestions(false)
              setSuggestionItems([])
            },
            onKeyDown: ({ event }) => {
              if (event.key === 'ArrowUp') {
                setSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestionItems.length - 1))
                return true
              }
              if (event.key === 'ArrowDown') {
                setSuggestionIndex(prev => (prev < suggestionItems.length - 1 ? prev + 1 : 0))
                return true
              }
              return false
            },
          }),
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[40px] max-h-[150px] overflow-y-auto px-4 py-2 text-sm text-zinc-100 w-full',
      },
    },
  })

  const filteredParticipants = suggestionItems.length > 0
    ? suggestionItems
    : participants.filter(p =>
      p.label.toLowerCase().includes(suggestionQuery.toLowerCase())
    )

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(full_name, email)')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
    setLoading(false)
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [dealId, supabase])

  useEffect(() => {
    fetchMessages()
    fetchParticipants()
    
    const channel = supabase.channel(`deal_chat_${dealId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `deal_id=eq.${dealId}` 
      }, payload => {
        setMessages(prev => {
          const exists = prev.some(m => m.id === payload.new.id)
          if (exists) return prev
          return [...prev, payload.new]
        })
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dealId, fetchParticipants, fetchMessages, supabase])

  const extractMentionIds = (editorState: any) => {
    const ids: string[] = []
    editorState.getJSON().content?.forEach((node: any) => {
      if (node.content) {
        node.content.forEach((child: any) => {
          if (child.type === 'mention') {
            ids.push(child.attrs.id)
          }
        })
      }
    })
    return ids
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!editor || editor.isEmpty) return

    const html = editor.getHTML()
    const text = editor.getText()
    const mentionIds = extractMentionIds(editor)
    
    editor.commands.clearContent()
    
    const { data: newMessageData, error } = await supabase.from('messages').insert({
      deal_id: dealId,
      sender_id: userId,
      content: html,
      msg_type: 'text',
      mentioned_user_ids: mentionIds
    }).select().single()

    if (error) {
      toast.error('Failed to send message')
      return
    }

    // Notify mentioned users
    if (mentionIds.length > 0) {
      mentionIds.forEach(mId => {
        if (mId === userId) return // Don't notify self
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: mId,
            type: 'mention',
            title: 'You were mentioned',
            body: `You were mentioned in the discussion for ${dealTitle}`,
            dealId: dealId,
          })
        })
      })
    }

    // Default partner notification
    if (!mentionIds.includes(partnerId) && partnerId !== userId) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: partnerId,
          type: 'new_discussion_message',
          title: 'New message received',
          body: `You have a new message in ${dealTitle}`,
          dealId: dealId,
        })
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `chat-files/${dealId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('chat_files')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('chat_files')
        .getPublicUrl(filePath)

      await supabase.from('messages').insert({
        deal_id: dealId,
        sender_id: userId,
        content: file.name,
        msg_type: 'file',
        file_url: publicUrl
      })
      
      toast.success('File uploaded')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const renderFileMessage = (msg: any) => {
    return (
      <div className="flex flex-col gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-xl max-w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{msg.content}</p>
            <p className="text-[10px] text-zinc-500 uppercase">Shared Attachment</p>
          </div>
          <a 
            href={msg.file_url} 
            download={msg.content}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {loading ? (
           <div className="flex items-center justify-center h-full text-zinc-500">Loading messages...</div>
        ) : messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-zinc-500">
             <Bot className="w-8 h-8 mb-4 opacity-50" />
             <p>This is the start of your secure negotiation.</p>
           </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId
            const isSystem = msg.msg_type === 'system'
            const isFile = msg.msg_type === 'file'
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-4 py-1.5 rounded-full flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    {msg.content}
                  </div>
                </div>
              )
            }
            
            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden mt-6">
                    {isMe ? <UserIcon className="w-4 h-4 text-zinc-400" /> : <span className="text-xs font-bold text-zinc-400">{partnerName.charAt(0)}</span>}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1 mx-1">
                      <span className="text-xs font-medium text-zinc-400">{isMe ? 'You' : (msg.sender?.full_name || partnerName)}</span>
                      <span className="text-[10px] text-zinc-600">{format(new Date(msg.created_at), 'h:mm a')}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
                    }`}>
                      {isFile ? renderFileMessage(msg) : (
                        <div dangerouslySetInnerHTML={{ __html: msg.content }} className="tiptap-content" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
        {/* Suggestion Dropdown */}
        {showSuggestions && filteredParticipants.length > 0 && (
          <div className="absolute bottom-[80px] left-4 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-950/50">Mention Participants</div>
            <div className="max-h-48 overflow-y-auto">
              {filteredParticipants.map((p, i) => (
                <button
                  key={p.id}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${i === suggestionIndex ? 'bg-emerald-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
                  onClick={() => {
                    editor?.commands.insertContent({ type: 'mention', attrs: p })
                    setShowSuggestions(false)
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
           <div className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl relative">
              <EditorContent editor={editor} />
              
              {uploading && (
                <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center rounded-2xl z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mr-2" />
                  <span className="text-xs text-zinc-400">Uploading file...</span>
                </div>
              )}
           </div>

           <div className="flex gap-2 mb-1">
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileUpload} 
               className="hidden" 
               accept=".pdf,.doc,.docx,image/*"
             />
             <Button 
               type="button" 
               variant="ghost" 
               size="icon" 
               className="rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
               onClick={() => fileInputRef.current?.click()}
               disabled={uploading}
             >
               <Paperclip className="w-5 h-5" />
             </Button>
             
             <Button 
               type="button" 
               onClick={handleSend} 
               disabled={!editor || editor.isEmpty || uploading} 
               size="icon" 
               className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white w-10 h-10 shrink-0 shadow-lg shadow-emerald-900/20"
             >
               <Send className="w-4 h-4" />
             </Button>
           </div>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 px-1">Tip: Type @ to mention participants. Files max 10MB.</p>
      </div>
      
      <style jsx global>{`
        .tiptap-content p {
          margin: 0;
        }
        .tiptap-content .mention {
          background-color: rgba(16, 185, 129, 0.2);
          color: #34d399;
          font-weight: 600;
          border-radius: 4px;
          padding: 0 4px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #52525b;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}
