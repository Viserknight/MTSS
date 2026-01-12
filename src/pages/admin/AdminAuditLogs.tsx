import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Search, ClipboardList, Activity } from "lucide-react";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredLogs(
        logs.filter(
          (log) =>
            log.action?.toLowerCase().includes(query) ||
            log.user_email?.toLowerCase().includes(query) ||
            JSON.stringify(log.details || {}).toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredLogs(logs);
    }
  }, [searchQuery, logs]);

  const fetchLogs = async () => {
    setIsLoading(true);

    const { data: logsData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Get user emails
    const userIds = [...new Set((logsData || []).map((log) => log.user_id).filter(Boolean))];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const logsWithUsers = (logsData || []).map((log) => ({
      ...log,
      user_email: profilesMap.get(log.user_id)?.email || "Unknown",
      user_name: profilesMap.get(log.user_id)?.full_name || "Unknown",
    }));

    setLogs(logsWithUsers);
    setFilteredLogs(logsWithUsers);
    setIsLoading(false);
  };

  const getActionBadge = (action: string) => {
    if (action.includes("created")) {
      return <Badge className="bg-success">Create</Badge>;
    }
    if (action.includes("updated") || action.includes("edited")) {
      return <Badge className="bg-accent text-accent-foreground">Update</Badge>;
    }
    if (action.includes("deleted")) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all teacher actions on the MTSS platform.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action or user..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log ({filteredLogs.length})
            </CardTitle>
            <CardDescription>
              Recent actions performed by teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.user_name}</p>
                            <p className="text-xs text-muted-foreground">{log.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionBadge(log.action)}
                            <span className="text-sm">{formatAction(log.action)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}