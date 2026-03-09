"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Image as ImageIcon, Clock, AlertCircle, FileText, Settings, RotateCcw } from "lucide-react";
import { isModuleEnabled } from "@/lib/modules";
import type { ImagingStudy } from "@/modules/pacs/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SourceType = "live" | "mixed" | "cache";

function formatDateTime(value?: string | Date) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function isToday(value?: string | Date) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
}

function statusVariant(status: string) {
  if (status === "reported") return "default";
  if (status === "completed") return "secondary";
  if (status === "cancelled") return "destructive";
  return "outline";
}

function priorityVariant(priority?: string) {
  if (priority === "stat") return "destructive";
  if (priority === "urgent") return "secondary";
  return "outline";
}

function StudiesTable({ studies, loading, emptyText }: { studies: ImagingStudy[]; loading: boolean; emptyText: string }) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (studies.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <ImageIcon aria-hidden className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ordered</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Study</TableHead>
            <TableHead>Body Part</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studies.map((study) => (
            <TableRow key={study.id} className="hover:bg-muted/40">
              <TableCell className="text-xs whitespace-nowrap">{formatDateTime(study.orderedAt)}</TableCell>
              <TableCell className="font-medium">{study.patientName || study.patientId}</TableCell>
              <TableCell className="whitespace-nowrap">{study.studyType}</TableCell>
              <TableCell>{study.bodyPart || "-"}</TableCell>
              <TableCell>
                <Badge variant={priorityVariant(study.priority)} className="uppercase tracking-wide">
                  {study.priority || "routine"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(study.status)}>{study.status.replace("_", " ")}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

export default function PACSPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<SourceType>("live");
  const [sourceWarning, setSourceWarning] = useState<string>("");

  useEffect(() => {
    setModuleEnabled(isModuleEnabled("pacs"));
  }, []);

  const loadStudies = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/pacs/studies", { signal });
      const data = await res.json();
      setStudies(data?.success && Array.isArray(data.studies) ? data.studies : []);
      setSource((data?.source as SourceType) || "live");
      setSourceWarning(data?.warning || "");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Failed to load PACS studies:", error);
      setStudies([]);
      setSource("cache");
      setSourceWarning("Could not load live source right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStudies(controller.signal);
    return () => controller.abort();
  }, [loadStudies]);

  const setQueryParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const activeTab = searchParams.get("tab") || "scheduled";
  const searchText = searchParams.get("q") || "";
  const filterStudy = searchParams.get("study") || "all";
  const filterPriority = searchParams.get("priority") || "all";
  const filterFrom = searchParams.get("from") || "";
  const filterTo = searchParams.get("to") || "";
  const sort = searchParams.get("sort") || "newest";
  const [searchDraft, setSearchDraft] = useState(searchText);

  useEffect(() => {
    setSearchDraft(searchText);
  }, [searchText]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchDraft !== searchText) setQueryParam("q", searchDraft);
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchDraft, searchText, setQueryParam]);

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const uniqueStudyTypes = useMemo(
    () => Array.from(new Set(studies.map((s) => s.studyType))).sort((a, b) => a.localeCompare(b)),
    [studies]
  );

  const baseScheduled = useMemo(
    () => studies.filter((s) => ["ordered", "scheduled", "in_progress"].includes(s.status)),
    [studies]
  );
  const basePending = useMemo(
    () => studies.filter((s) => s.status === "completed" && !s.report),
    [studies]
  );
  const baseCompleted = useMemo(
    () => studies.filter((s) => s.status === "reported" || (s.status === "completed" && !!s.report)),
    [studies]
  );

  const applyFilters = (input: ImagingStudy[]) => {
    const q = searchText.trim().toLowerCase();
    const from = filterFrom ? new Date(`${filterFrom}T00:00:00`) : null;
    const to = filterTo ? new Date(`${filterTo}T23:59:59`) : null;

    const filtered = input.filter((study) => {
      if (q) {
        const hay = `${study.patientName || ""} ${study.patientId} ${study.studyType} ${study.bodyPart || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterStudy !== "all" && study.studyType !== filterStudy) return false;
      if (filterPriority !== "all" && study.priority !== filterPriority) return false;

      if (from || to) {
        const orderedAt = new Date(study.orderedAt);
        if (Number.isNaN(orderedAt.getTime())) return false;
        if (from && orderedAt < from) return false;
        if (to && orderedAt > to) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const aTime = new Date(a.orderedAt).getTime() || 0;
      const bTime = new Date(b.orderedAt).getTime() || 0;
      if (sort === "oldest") return aTime - bTime;
      if (sort === "priority") {
        const rank: Record<string, number> = { stat: 0, urgent: 1, routine: 2 };
        const diff = (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
        if (diff !== 0) return diff;
      }
      return bTime - aTime;
    });
  };

  const scheduledStudies = useMemo(() => applyFilters(baseScheduled), [baseScheduled, searchText, filterStudy, filterPriority, filterFrom, filterTo, sort]);
  const pendingReports = useMemo(() => applyFilters(basePending), [basePending, searchText, filterStudy, filterPriority, filterFrom, filterTo, sort]);
  const completedStudies = useMemo(() => applyFilters(baseCompleted), [baseCompleted, searchText, filterStudy, filterPriority, filterFrom, filterTo, sort]);
  const allStudies = useMemo(() => applyFilters(studies), [studies, searchText, filterStudy, filterPriority, filterFrom, filterTo, sort]);

  const todaysStudies = useMemo(() => studies.filter((s) => isToday(s.orderedAt)).length, [studies]);
  const criticalFindings = useMemo(() => studies.filter((s) => s.report?.criticalFindings).length, [studies]);

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ImageIcon aria-hidden className="h-8 w-8" />
            PACS
          </h1>
          <p className="text-muted-foreground mt-2">Medical imaging</p>
        </div>
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertTitle>Module Not Enabled</AlertTitle>
          <AlertDescription>
            The PACS module is currently disabled. To use this feature, please enable it in Settings.
            <div className="mt-4">
              <Button asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Settings
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ImageIcon aria-hidden className="h-8 w-8" />
            PACS
          </h1>
          <p className="text-muted-foreground mt-2">Medical imaging workflow and reporting queue</p>
        </div>
        <Button asChild>
          <Link href="/pacs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Imaging Order
          </Link>
        </Button>
      </div>

      {source !== "live" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{source === "cache" ? "Using Cached Data" : "Showing Merged Data"}</AlertTitle>
          <AlertDescription>
            {sourceWarning || "Live data source is currently degraded. Results are still available from backend cache."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Studies</CardTitle>
            <ImageIcon aria-hidden className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{todaysStudies}</div>}
            <p className="text-xs text-muted-foreground">Total studies ordered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{baseScheduled.length}</div>}
            <p className="text-xs text-muted-foreground">Upcoming appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{basePending.length}</div>}
            <p className="text-xs text-muted-foreground">Awaiting interpretation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Findings</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{criticalFindings}</div>}
            <p className="text-xs text-muted-foreground">Urgent attention needed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and sort imaging studies (saved in URL)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <Input
            placeholder="Patient, study, body part"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="lg:col-span-2"
          />
          <Select value={filterStudy} onValueChange={(v) => setQueryParam("study", v)}>
            <SelectTrigger><SelectValue placeholder="Study type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All studies</SelectItem>
              {uniqueStudyTypes.map((study) => (
                <SelectItem key={study} value={study}>{study}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(v) => setQueryParam("priority", v)}>
            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="stat">STAT</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={filterFrom} onChange={(e) => setQueryParam("from", e.target.value)} />
          <Input type="date" value={filterTo} onChange={(e) => setQueryParam("to", e.target.value)} />
          <Select value={sort} onValueChange={(v) => setQueryParam("sort", v)}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="priority">Priority first</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-2 lg:col-span-6 flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button type="button" variant="outline" onClick={() => loadStudies()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setQueryParam("tab", v)} className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="pending">Pending Reports</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Studies</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Studies</CardTitle>
              <CardDescription>Imaging studies scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              <StudiesTable studies={scheduledStudies} loading={loading} emptyText="No scheduled studies" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reports</CardTitle>
              <CardDescription>Studies awaiting radiologist interpretation</CardDescription>
            </CardHeader>
            <CardContent>
              <StudiesTable studies={pendingReports} loading={loading} emptyText="No pending reports" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Studies</CardTitle>
              <CardDescription>Studies with final reports available</CardDescription>
            </CardHeader>
            <CardContent>
              <StudiesTable studies={completedStudies} loading={loading} emptyText="No completed studies" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Studies</CardTitle>
              <CardDescription>Complete imaging history</CardDescription>
            </CardHeader>
            <CardContent>
              <StudiesTable studies={allStudies} loading={loading} emptyText="No imaging studies recorded" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
