"use client";

import { useState, useEffect } from "react";
import { ExportFormat } from "@/lib/types";
import { getDefaultExportFormat, setDefaultExportFormat } from "@/lib/preferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, RefreshCw } from "lucide-react";

interface ImportSectionProps {
  onImport: (format: ExportFormat, jsonl: string) => Promise<void>;
  loading?: boolean;
  result?: string;
}

export function ImportSection({ onImport, loading = false, result = "" }: ImportSectionProps) {
  const [importText, setImportText] = useState<string>("");
  const [importFormat, setImportFormat] = useState<ExportFormat>("openai_chat");

  // Load preferred format on mount
  useEffect(() => {
    const preferredFormat = getDefaultExportFormat();
    setImportFormat(preferredFormat);
  }, []);

  async function handleImport() {
    if (!importText.trim()) return;
    await onImport(importFormat, importText);
    setImportText("");
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Import JSONL
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="space-y-2 sm:space-y-0">
              <Label htmlFor="import-format" className="sr-only">Import format</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select value={importFormat} onValueChange={(value) => {
                    const format = value as ExportFormat;
                    setImportFormat(format);
                    setDefaultExportFormat(format); // Remember user's choice
                  }}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai_chat">OpenAI Chat JSONL</SelectItem>
                      <SelectItem value="gemini">Gemini JSONL</SelectItem>
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose the format of your JSONL data. Your preference will be saved.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleImport}
                  disabled={!importText.trim() || loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import'
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import JSONL data into this dataset</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jsonl-content">JSONL Content</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Textarea
                id="jsonl-content"
                className="min-h-32 font-mono text-sm"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSONL content here..."
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Paste your JSONL data here. Each line should be a complete JSON object.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {result && (
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {result}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
