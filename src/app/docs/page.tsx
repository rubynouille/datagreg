"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  BookOpen, 
  Database, 
  Download, 
  FileText, 
  HelpCircle, 
  Lightbulb, 
  MessageSquare, 
  Shield, 
  Target, 
  Upload,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10 flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pt-16">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white mb-6">
            <Image src="/logo.png" alt="DataGreg logo" width={64} height={64} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 flex items-center justify-center gap-4">
            <BookOpen className="h-8 w-8 text-primary" />
            DataGreg Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about creating, managing, and exporting datasets for AI model training.
          </p>
        </header>

        {/* Quick Start Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Get up and running with DataGreg in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Select Data Folder</h3>
                <p className="text-sm text-muted-foreground">Choose where your datasets will be stored locally</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Create Dataset</h3>
                <p className="text-sm text-muted-foreground">Organize your training data into named datasets</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Add & Export</h3>
                <p className="text-sm text-muted-foreground">Add training pairs and export for AI platforms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Concepts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Core Concepts
            </CardTitle>
            <CardDescription>
              Understanding the fundamentals of DataGreg
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Datasets</h3>
                  <p className="text-muted-foreground mb-3">
                    Datasets are collections of training pairs organized by purpose or model type. Examples include &quot;Customer Support&quot;, &quot;Code Generation&quot;, or &quot;Creative Writing&quot;.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Organized</Badge>
                    <Badge variant="secondary">Searchable</Badge>
                    <Badge variant="secondary">Exportable</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Training Pairs</h3>
                  <p className="text-muted-foreground mb-3">
                    Each training pair consists of an input (what you send to the AI) and an output (what you expect back). The more quality pairs you have, the better your AI model will perform.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Input + Output</Badge>
                    <Badge variant="secondary">Quality over Quantity</Badge>
                    <Badge variant="secondary">Consistent Format</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Local Storage</h3>
                  <p className="text-muted-foreground mb-3">
                    Your data never leaves your computer. Everything is stored locally using your browser&apos;s File System Access API, ensuring complete privacy and control.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">100% Private</Badge>
                    <Badge variant="secondary">No Upload</Badge>
                    <Badge variant="secondary">Full Control</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips & Best Practices */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Tips & Best Practices
            </CardTitle>
            <CardDescription>
              Expert advice for creating high-quality training datasets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Be Specific with Inputs</h4>
                    <p className="text-sm text-muted-foreground">
                      Write clear, specific inputs that represent real use cases. Avoid vague prompts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Consistent Output Format</h4>
                    <p className="text-sm text-muted-foreground">
                      Keep your outputs in a consistent format. If using JSON, always use valid JSON structure.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Quality Over Quantity</h4>
                    <p className="text-sm text-muted-foreground">
                      100 high-quality pairs are better than 1000 mediocre ones. Focus on accuracy and relevance.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Cover Edge Cases</h4>
                    <p className="text-sm text-muted-foreground">
                      Include examples of how to handle unusual inputs, errors, or boundary conditions.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Avoid Personal Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Never include real personal data, passwords, or sensitive information in training pairs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Test Your Exports</h4>
                    <p className="text-sm text-muted-foreground">
                      Always test exported files with your target platform before large-scale training.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Use Descriptive Names</h4>
                    <p className="text-sm text-muted-foreground">
                      Name your datasets clearly: &quot;Email-Customer-Support&quot; not &quot;Dataset1&quot;.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Regular Backups</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the backup feature regularly, especially before making major changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Formats Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Formats Guide
            </CardTitle>
            <CardDescription>
              Understanding different export formats for various AI platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">OpenAI Chat JSONL</h3>
                  <Badge>Recommended</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Perfect for fine-tuning OpenAI&apos;s GPT models. Each line contains a conversation with system, user, and assistant messages.
                </p>
                <div className="bg-muted rounded p-3 text-sm font-mono mb-3">
                  {`{"messages": [{"role": "user", "content": "Your input"}, {"role": "assistant", "content": "Expected output"}]}`}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">GPT-4.1</Badge>
                  <Badge variant="outline">GPT-4o</Badge>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Gemini JSONL</h3>
                </div>
                <p className="text-muted-foreground mb-3">
                  Optimized for Google&apos;s Gemini models. Uses a different message structure compatible with Gemini&apos;s training format.
                </p>
                <div className="bg-muted rounded p-3 text-sm font-mono mb-3">
                  <code>
                    {JSON.stringify({
                      contents: [
                        { role: "user", parts: [{ text: "Your input" }] },
                        { role: "model", parts: [{ text: "Expected output" }] }
                      ]
                    })}
                  </code>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Gemini 2.5 Pro</Badge>
                  <Badge variant="outline">Gemini 2.5 Flash</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Troubleshooting
            </CardTitle>
            <CardDescription>
              Solutions to common issues and problems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-destructive">Browser not supported</h4>
                <p className="text-muted-foreground mb-3">
                  DataGreg requires the File System Access API, which is only available in Chromium-based browsers.
                </p>
                <p className="text-sm">
                  <strong>Solution:</strong> Use Chrome, Edge, or any Chromium-based browser. Firefox and Safari are not supported.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-destructive">Lost access to data folder</h4>
                <p className="text-muted-foreground mb-3">
                  Your browser lost permission to access the selected folder.
                </p>
                <p className="text-sm">
                  <strong>Solution:</strong> Re-select your data folder. Enable &quot;Remember this folder&quot; to avoid this in the future.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-destructive">Export file appears empty</h4>
                <p className="text-muted-foreground mb-3">
                  The exported JSONL file doesn&apos;t contain your training pairs.
                </p>
                <p className="text-sm">
                  <strong>Solution:</strong> Ensure your dataset has training pairs. Check that your browser allows file downloads from this site.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-amber-600">Slow performance with large datasets</h4>
                <p className="text-muted-foreground mb-3">
                  The interface becomes sluggish with thousands of training pairs.
                </p>
                <p className="text-sm">
                  <strong>Solution:</strong> Use the search feature to filter pairs. Consider splitting very large datasets into smaller, focused ones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Advanced Features
            </CardTitle>
            <CardDescription>
              Power user features and advanced functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Import JSONL</h4>
                <p className="text-muted-foreground mb-3">
                  Import existing JSONL files from other tools or previous exports. Supports both OpenAI and Gemini formats.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Batch Import</Badge>
                  <Badge variant="outline">Format Detection</Badge>
                  <Badge variant="outline">Duplicate Prevention</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Backup & Restore</h4>
                <p className="text-muted-foreground mb-3">
                  Automatically backup your datasets and restore from previous versions. Protects against accidental data loss.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Auto Backup</Badge>
                  <Badge variant="outline">Version History</Badge>
                  <Badge variant="outline">One-Click Restore</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Search & Filter</h4>
                <p className="text-muted-foreground mb-3">
                  Powerful search through your training pairs. Find specific inputs or outputs quickly, even in large datasets.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Full Text Search</Badge>
                  <Badge variant="outline">Real-time Results</Badge>
                  <Badge variant="outline">Case Insensitive</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground mb-4">
            Need more help? DataGreg is open source and community-driven.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="https://github.com/rubynouille/datagreg" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                View on GitHub
              </Button>
            </Link>
            <Link href="/">
              <Button variant="default" size="sm">
                Start Creating Datasets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
