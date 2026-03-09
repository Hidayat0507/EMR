"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TestTube, Clock, CheckCircle, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isModuleEnabled } from "@/lib/modules";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { POCTTest, POCTResultType } from "@/modules/poct/types";

export default function POCTPage() {
  const searchParams = useSearchParams();
  const createdId = searchParams.get("createdId");

  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [tests, setTests] = useState<POCTTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [patientFilter, setPatientFilter] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingTestId, setUpdatingTestId] = useState<string | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [activeResultTest, setActiveResultTest] = useState<POCTTest | null>(null);
  const [resultForm, setResultForm] = useState<{
    resultType: POCTResultType;
    numericValue: string;
    unit: string;
    referenceRange: string;
    findings: string;
    interpretation: string;
  }>({
    resultType: "normal",
    numericValue: "",
    unit: "",
    referenceRange: "",
    findings: "",
    interpretation: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    setModuleEnabled(isModuleEnabled("poct"));
  }, []);

  useEffect(() => {
    const optimisticRaw = typeof window !== "undefined" ? sessionStorage.getItem("poct-order-optimistic") : null;
    if (!optimisticRaw) {
      return;
    }
    try {
      const optimistic = JSON.parse(optimisticRaw) as POCTTest;
      setTests((prev) => {
        if (prev.some((item) => item.id === optimistic.id)) {
          return prev;
        }
        return [optimistic, ...prev];
      });
    } catch {
      // Ignore malformed optimistic cache.
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("poct-order-optimistic");
      }
    }
  }, []);

  useEffect(() => {
    if (!moduleEnabled) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadTests = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/poct/tests?scope=all");
        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load POCT tests");
        }
        if (mounted) {
          setTests(data.tests || []);
        }
      } catch (error: any) {
        console.error("Error loading POCT tests:", error);
        if (mounted) {
          setLoadError(error?.message || "Failed to load POCT tests");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTests();
    return () => {
      mounted = false;
    };
  }, [moduleEnabled]);

  const isToday = (value: Date | string) => {
    const date = new Date(value);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const relativeTime = (value: Date | string) => {
    const target = new Date(value).getTime();
    const diffMs = target - Date.now();
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    const minutes = Math.round(diffMs / 60000);
    if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
    const days = Math.round(hours / 24);
    return rtf.format(days, "day");
  };

  const formatDateTime = (value: Date | string) => {
    const date = new Date(value);
    return date.toLocaleString();
  };

  const getStatusVariant = (status: POCTTest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "completed") return "default";
    if (status === "cancelled") return "destructive";
    if (status === "in_progress") return "secondary";
    return "outline";
  };

  const getUrgencyVariant = (urgency?: POCTTest["urgency"]): "default" | "secondary" | "destructive" | "outline" => {
    if (urgency === "stat") return "destructive";
    if (urgency === "urgent") return "secondary";
    return "outline";
  };

  const availableTestNames = useMemo(() => {
    return Array.from(new Set(tests.map((test) => test.testName))).sort();
  }, [tests]);

  const filteredTests = useMemo(() => {
    const patientQuery = patientFilter.trim().toLowerCase();
    return tests.filter((test) => {
      const matchesPatient = !patientQuery
        || test.patientName?.toLowerCase().includes(patientQuery)
        || test.patientId.toLowerCase().includes(patientQuery);
      const matchesTestType = testTypeFilter === "all" || test.testName === testTypeFilter;
      const matchesUrgency = urgencyFilter === "all" || (test.urgency || "routine") === urgencyFilter;
      const matchesStatus = statusFilter === "all" || test.status === statusFilter;
      return matchesPatient && matchesTestType && matchesUrgency && matchesStatus;
    });
  }, [patientFilter, statusFilter, testTypeFilter, tests, urgencyFilter]);

  const todayTests = filteredTests.filter((test) => isToday(test.orderedAt));
  const pendingTests = filteredTests.filter((test) => test.status === "pending" || test.status === "in_progress");
  const completedTests = filteredTests.filter((test) => test.status === "completed");
  const abnormalCount = filteredTests.filter((test) => test.result?.resultType === "abnormal").length;
  const recentOrder = createdId ? tests.find((test) => test.id === createdId) : undefined;

  const renderStatsValue = (value: number) => {
    if (loading && tests.length === 0) {
      return <div className="h-8 w-12 animate-pulse rounded bg-muted" />;
    }
    return <div className="text-2xl font-bold">{value}</div>;
  };

  const renderListSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-md border p-4 space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );

  const openResultDialog = (test: POCTTest) => {
    setActiveResultTest(test);
    setResultForm({
      resultType: test.result?.resultType || "normal",
      numericValue: typeof test.result?.numericValue === "number" ? String(test.result.numericValue) : "",
      unit: test.result?.unit || "",
      referenceRange: test.result?.referenceRange || "",
      findings: test.result?.findings || "",
      interpretation: test.result?.interpretation || "",
    });
    setIsResultDialogOpen(true);
  };

  const handleCompleteWithResult = async () => {
    if (!activeResultTest) return;

    const numeric = resultForm.numericValue.trim();
    const numericValue = numeric ? Number(numeric) : undefined;
    if (numeric && Number.isNaN(numericValue)) {
      toast({
        title: "Invalid numeric result",
        description: "Numeric value must be a valid number.",
        variant: "destructive",
      });
      return;
    }

    if (!resultForm.findings.trim() && !numeric) {
      toast({
        title: "Result required",
        description: "Enter findings or numeric value before completing the test.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingTestId(activeResultTest.id);
      const payloadResult = {
        resultType: resultForm.resultType,
        numericValue,
        unit: resultForm.unit.trim() || undefined,
        referenceRange: resultForm.referenceRange.trim() || undefined,
        findings: resultForm.findings.trim() || undefined,
        interpretation: resultForm.interpretation.trim() || undefined,
      };
      const response = await fetch("/api/poct/tests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeResultTest.id,
          status: "completed",
          notes: payloadResult.findings || payloadResult.interpretation,
          result: payloadResult,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to update test status");
      }

      const nowIso = new Date().toISOString();
      setTests((prev) =>
        prev.map((item) =>
          item.id === activeResultTest.id
            ? {
                ...item,
                status: "completed",
                completedAt: nowIso,
                updatedAt: nowIso,
                result: {
                  resultType: payloadResult.resultType,
                  numericValue: payloadResult.numericValue,
                  unit: payloadResult.unit,
                  referenceRange: payloadResult.referenceRange,
                  findings: payloadResult.findings,
                  interpretation: payloadResult.interpretation,
                },
              }
            : item
        )
      );

      setIsResultDialogOpen(false);
      setActiveResultTest(null);
      toast({
        title: "POCT test completed",
        description: `${activeResultTest.testName} completed and synced to Medplum.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update POCT test",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingTestId(null);
    }
  };

  const renderTestList = (items: POCTTest[], emptyMessage: string) => {
    if (loading && tests.length === 0) {
      return renderListSkeleton();
    }

    if (loadError) {
      return (
        <div className="py-12 text-center text-destructive">
          {loadError}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((test) => (
          <div
            key={test.id}
            className={`rounded-md border p-4 space-y-2 ${createdId === test.id ? "border-primary bg-primary/5" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{test.testName}</div>
              <div className="flex gap-2">
                <Badge variant={getStatusVariant(test.status)}>{test.status.replace("_", " ")}</Badge>
                <Badge variant={getUrgencyVariant(test.urgency)}>{test.urgency || "routine"}</Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {test.patientName || "Unknown patient"} • Ordered by {test.orderedBy}
            </div>
            <div className="text-sm text-muted-foreground">
              <span title={formatDateTime(test.orderedAt)}>Ordered {relativeTime(test.orderedAt)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Created in Medplum</Badge>
              <Badge variant="outline">
                Synced at {formatDateTime(test.updatedAt || test.orderedAt)}
              </Badge>
              {test.status !== "completed" && test.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={updatingTestId === test.id}
                  onClick={() => openResultDialog(test)}
                >
                  {updatingTestId === test.id ? "Updating..." : "Enter Result"}
                </Button>
              )}
            </div>
            {test.notes && (
              <div className="text-sm">
                {test.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            POCT
          </h1>
          <p className="text-muted-foreground mt-2">
            On-site laboratory testing and results management
          </p>
        </div>

        <Alert>
          <Settings className="h-4 w-4" />
          <AlertTitle>Module Not Enabled</AlertTitle>
          <AlertDescription>
            The POCT module is currently disabled. To use this feature, please enable it in Settings.
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            POCT
          </h1>
          <p className="text-muted-foreground mt-2">
            On-site laboratory testing and results management
          </p>
        </div>
        <Button asChild>
          <Link href="/poct/new">
            <Plus className="mr-2 h-4 w-4" /> New Test Order
          </Link>
        </Button>
      </div>

      {recentOrder && (
        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertTitle>Recent Order Created</AlertTitle>
          <AlertDescription>
            {recentOrder.patientName || "Patient"}: {recentOrder.testName} ({recentOrder.id})
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Find tests quickly by patient, type, urgency, and status</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Filter patient..."
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
          />
          <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Test Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All test types</SelectItem>
              {availableTestNames.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgency</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="stat">STAT</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Tests</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderStatsValue(todayTests.length)}
            <p className="text-xs text-muted-foreground">Total tests ordered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {renderStatsValue(pendingTests.length)}
            <p className="text-xs text-muted-foreground">Awaiting results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {renderStatsValue(completedTests.length)}
            <p className="text-xs text-muted-foreground">Results ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Abnormal</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {renderStatsValue(abnormalCount)}
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tests</CardTitle>
              <CardDescription>Tests awaiting performance or results</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTestList(pendingTests, "No pending tests")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tests</CardTitle>
              <CardDescription>Tests with results available</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTestList(completedTests, "No completed tests")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Tests</CardTitle>
              <CardDescription>Complete test history</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTestList(filteredTests, "No tests recorded")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter POCT Result</DialogTitle>
            <DialogDescription>
              Complete test: {activeResultTest?.testName || "POCT test"} for {activeResultTest?.patientName || "patient"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Result Type</Label>
              <Select
                value={resultForm.resultType}
                onValueChange={(value) => setResultForm((prev) => ({ ...prev, resultType: value as POCTResultType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="abnormal">Abnormal</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="inconclusive">Inconclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Numeric Value</Label>
                <Input
                  placeholder="e.g. 6.8"
                  value={resultForm.numericValue}
                  onChange={(e) => setResultForm((prev) => ({ ...prev, numericValue: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input
                  placeholder="e.g. mmol/L"
                  value={resultForm.unit}
                  onChange={(e) => setResultForm((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Reference Range</Label>
              <Input
                placeholder="e.g. 3.9 - 7.8 mmol/L"
                value={resultForm.referenceRange}
                onChange={(e) => setResultForm((prev) => ({ ...prev, referenceRange: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Findings</Label>
              <Input
                placeholder="Enter findings"
                value={resultForm.findings}
                onChange={(e) => setResultForm((prev) => ({ ...prev, findings: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Interpretation</Label>
              <Input
                placeholder="Enter interpretation"
                value={resultForm.interpretation}
                onChange={(e) => setResultForm((prev) => ({ ...prev, interpretation: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteWithResult} disabled={!activeResultTest || updatingTestId === activeResultTest?.id}>
              {updatingTestId === activeResultTest?.id ? "Saving..." : "Save & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
