"use client";

import { Dataset } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Database, Calendar, FolderOpen } from "lucide-react";

interface DatasetCardProps {
  dataset: Dataset;
  onRename: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
}

export function DatasetCard({ dataset, onRename, onDelete }: DatasetCardProps) {
  const itemCount = dataset.items?.length || 0;
  const lastUpdated = new Date(dataset.updatedAt).toLocaleDateString();

  return (
    <Card className="group hover:shadow-lg h-full flex flex-col dataset-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FolderOpen className="h-10 w-10 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg mb-1 truncate">{dataset.name}</CardTitle>
              <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3 shrink-0" />
                  <span>{itemCount} pair{itemCount === 1 ? '' : 's'}</span>
                </div>
                <span className="hidden sm:inline text-muted-foreground/50">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="truncate">{lastUpdated}</span>
                </div>
              </CardDescription>
            </div>
          </div>
          
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More actions for {dataset.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRename(dataset)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(dataset)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3 flex-1 flex flex-col">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg border bg-muted/50 p-2 sm:p-3 text-center">
            <div className="text-lg sm:text-2xl font-bold text-primary">{itemCount}</div>
            <div className="text-xs text-muted-foreground">Training Pairs</div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-2 sm:p-3 text-center">
            <Badge variant="secondary" className="text-xs font-mono mb-1">
              {dataset.id.slice(-6).toUpperCase()}
            </Badge>
            <div className="text-xs text-muted-foreground">Dataset ID</div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-auto">
          <Button asChild className="w-full">
            <Link href={`/dataset/${dataset.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Edit Dataset</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
