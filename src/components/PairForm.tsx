"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, FileText, MessageSquare, Database } from "lucide-react";

interface PairFormProps {
  onSubmit: (input: string, output: string) => Promise<void>;
  loading?: boolean;
  pairCount?: number;
}

export function PairForm({ onSubmit, loading = false, pairCount = 0 }: PairFormProps) {
  const [form, setForm] = useState({ input: "", output: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.input.trim() || !form.output.trim()) return;
    
    await onSubmit(form.input, form.output);
    setForm({ input: "", output: "" });
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add New Pair
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="input-field" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Input
              </Label>
              <Textarea
                id="input-field"
                className="min-h-32 resize-y"
                value={form.input}
                onChange={(e) => setForm((s) => ({ ...s, input: e.target.value }))}
                placeholder="Enter the input prompt or source text..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="output-field" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Output
              </Label>
              <Textarea
                id="output-field"
                className="min-h-32 resize-y"
                value={form.output}
                onChange={(e) => setForm((s) => ({ ...s, output: e.target.value }))}
                placeholder="Enter the expected model response or target text..."
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {loading ? (
                <Badge variant="secondary" className="gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Processing...
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-2">
                  <Database className="h-3 w-3" />
                  {pairCount} pair{pairCount === 1 ? "" : "s"} in dataset
                </Badge>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!form.input.trim() || !form.output.trim() || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pair
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
