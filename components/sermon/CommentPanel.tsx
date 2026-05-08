'use client'

import React, { useMemo, useState } from 'react'
import { MessageSquare, Check, Trash2, Reply, X } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { SermonComment } from '@/store/types'

/** Format relative time */
function formatTime(timestamp: number, isZh: boolean): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return isZh ? '刚刚' : 'Just now'
  if (minutes < 60) return isZh ? `${minutes}分钟前` : `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return isZh ? `${hours}小时前` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  return isZh ? `${days}天前` : `${days}d ago`
}

/**
 * CommentPanel — 讲章评论批注面板
 *
 * Features:
 * - List of comments with author, time, and selected text context
 * - Reply support (threaded comments)
 * - Resolve and delete actions
 * - Add new comment form
 * - Filter: all / open / resolved
 */
export function CommentPanel() {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const {
    sermonComments,
    currentSermon,
    addSermonComment,
    resolveSermonComment,
    deleteSermonComment,
  } = useBibleStore()

  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  const filteredComments = useMemo(() => {
    const sermonId = currentSermon?.id
    if (!sermonId) return []
    let comments = sermonComments.filter(c => c.sermonId === sermonId)
    if (filter === 'open') comments = comments.filter(c => !c.resolved)
    if (filter === 'resolved') comments = comments.filter(c => c.resolved)
    // Top-level comments first, then replies
    return comments.sort((a, b) => b.createdAt - a.createdAt)
  }, [sermonComments, currentSermon?.id, filter])

  const openCount = sermonComments.filter(c => c.sermonId === currentSermon?.id && !c.resolved).length
  const resolvedCount = sermonComments.filter(c => c.sermonId === currentSermon?.id && c.resolved).length

  const handleAddComment = () => {
    if (!newComment.trim() || !currentSermon?.id) return
    addSermonComment({
      sermonId: currentSermon.id,
      content: newComment.trim(),
      authorId: 'current-user',
      authorName: isZh ? '我' : 'Me',
      position: { line: 0, col: 0 },
      parentId: replyToId || undefined,
    })
    setNewComment('')
    setReplyToId(null)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={12} className="text-green-500" />
          <span className="text-xs font-medium text-foreground">
            {isZh ? '批注' : 'Comments'}
          </span>
        </div>
        <div className="flex gap-1">
          {(['all', 'open', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-1.5 py-0.5 rounded text-[10px] transition-colors
                ${filter === f
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                  : 'text-muted-foreground hover:bg-accent/50'
                }
              `}
            >
              {f === 'all' ? (isZh ? '全部' : 'All') : f === 'open' ? `${openCount} ${isZh ? '待处理' : 'Open'}` : `${resolvedCount} ${isZh ? '已解决' : 'Done'}`}
            </button>
          ))}
        </div>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto">
        {filteredComments.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {isZh ? '暂无批注' : 'No comments yet'}
          </div>
        ) : (
          filteredComments.map(comment => (
            <div
              key={comment.id}
              className={`
                px-3 py-2 border-b border-border/50
                ${comment.resolved ? 'opacity-60' : ''}
                ${comment.parentId ? 'pl-6 bg-muted/10' : ''}
              `}
            >
              {/* Comment header */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-medium text-foreground">{comment.authorName}</span>
                <span className="text-[9px] text-muted-foreground">{formatTime(comment.createdAt, isZh)}</span>
                {comment.resolved && (
                  <span className="px-1 py-0 rounded text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    {isZh ? '已解决' : 'Resolved'}
                  </span>
                )}
              </div>

              {/* Selected text context */}
              {comment.selectedText && (
                <div className="text-[10px] text-muted-foreground/70 bg-muted/20 rounded px-1.5 py-0.5 mb-1 italic line-clamp-1">
                  "{comment.selectedText}"
                </div>
              )}

              {/* Comment content */}
              <div className="text-xs text-foreground/80 leading-relaxed">{comment.content}</div>

              {/* Actions */}
              <div className="flex items-center gap-1 mt-1">
                {!comment.resolved && (
                  <>
                    <button
                      onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] text-muted-foreground hover:bg-accent/50 transition-colors"
                    >
                      <Reply size={9} />
                      {isZh ? '回复' : 'Reply'}
                    </button>
                    <button
                      onClick={() => resolveSermonComment(comment.id)}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] text-muted-foreground hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 transition-colors"
                    >
                      <Check size={9} />
                      {isZh ? '解决' : 'Resolve'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteSermonComment(comment.id)}
                  className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] text-muted-foreground hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <div className="border-t border-border px-3 py-2">
        {replyToId && (
          <div className="flex items-center gap-1 mb-1 text-[10px] text-muted-foreground">
            <Reply size={9} />
            {isZh ? '回复中' : 'Replying'}
            <button onClick={() => setReplyToId(null)} className="ml-auto">
              <X size={9} />
            </button>
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder={isZh ? '添加批注...' : 'Add a comment...'}
            className="flex-1 px-2 py-1 rounded text-xs bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-2 py-1 rounded text-[10px] bg-green-500 text-white disabled:opacity-40 hover:bg-green-600 transition-colors"
          >
            {isZh ? '发送' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
