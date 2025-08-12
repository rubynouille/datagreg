"use client";

import { useState } from "react";
import { DatasetPair } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Check, X, FileText, MessageSquare, RefreshCw } from "lucide-react";

interface PairItemProps {
  pair: DatasetPair;
  onEdit: (pair: DatasetPair) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
  onSave?: (id: string, input: string, output: string) => void;
  onCancelEdit?: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function PairItem({ 
  pair, 
  onEdit, 
  onDelete, 
  isEditing = false, 
  onSave, 
  onCancelEdit, 
  isUpdating = false, 
  isDeleting = false 
}: PairItemProps) {
  const [editForm, setEditForm] = useState({ input: pair.input, output: pair.output });

  function handleSave() {
    if (onSave && editForm.input.trim() && editForm.output.trim()) {
      onSave(pair.id, editForm.input, editForm.output);
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      {isEditing ? (
        // Edit Mode
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`edit-input-${pair.id}`} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Input
                </Label>
                <Textarea
                  id={`edit-input-${pair.id}`}
                  className="min-h-24 resize-y"
                  value={editForm.input}
                  onChange={(e) => setEditForm({ ...editForm, input: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-output-${pair.id}`} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Output
                </Label>
                <Textarea
                  id={`edit-output-${pair.id}`}
                  className="min-h-24 resize-y"
                  value={editForm.output}
                  onChange={(e) => setEditForm({ ...editForm, output: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={onCancelEdit}
                disabled={isUpdating}
                size="sm"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating || !editForm.input.trim() || !editForm.output.trim()}
                size="sm"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        // View Mode
        <>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Input
                </Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{pair.input}</pre>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  Output
                </Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{pair.output}</pre>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {new Date(pair.createdAt).toLocaleDateString()}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono">
                  ID: {pair.id.slice(-8)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(pair)}
                  disabled={isDeleting}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(pair.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
