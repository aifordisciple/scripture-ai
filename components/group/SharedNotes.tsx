"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText, Loader2, User, BookOpen, Share2
} from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/constants";
import { MemberProfile } from "./MemberProfile";
import { useTranslation } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";

interface SharedNote {
  id: string;
  bookId: string;
  chapter: number;
  verse: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface SharedNotesProps {
  churchId: string;
}

export function SharedNotes({ churchId }: SharedNotesProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<string>("all");

  useEffect(() => {
    fetchNotes();
  }, [churchId, selectedBook]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBook && selectedBook !== "all") {
        params.append("bookId", selectedBook);
      }

      const res = await fetch(`/api/church/${churchId}/notes?${params.toString()}`);
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error("Failed to fetch shared notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateClient(new Date(dateStr), {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getBookName = (bookId: string) => {
    return BIBLE_BOOKS.find(b => b.id === bookId)?.name || bookId;
  };

  // Get unique books from notes
  const booksInNotes = [...new Set(notes.map(n => n.bookId))];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {t('group.sharedNotes')}
            <span className="text-sm font-normal text-muted-foreground">
              ({notes.length})
            </span>
          </span>
          {booksInNotes.length > 0 && (
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder={t('group.filterBook')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('group.allBooks')}</SelectItem>
                {booksInNotes.map(bookId => (
                  <SelectItem key={bookId} value={bookId}>
                    {getBookName(bookId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('group.noSharedNotes')}</p>
            <p className="text-xs mt-1">{t('group.noSharedNotesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-primary dark:text-primary">
                        {getBookName(note.bookId)} {note.chapter}:{note.verse}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <MemberProfile
                        userId={note.user.id}
                        churchId={churchId}
                        trigger={
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <User className="w-3 h-3" />
                            {note.user.name || t('group.anonymousUser')}
                          </button>
                        }
                      />
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}