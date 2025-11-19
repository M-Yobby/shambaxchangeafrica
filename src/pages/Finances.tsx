import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddLedgerDialog from "@/components/AddLedgerDialog";
import { format } from "date-fns";

interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  item: string;
  amount: number;
  quantity: number | null;
  notes: string | null;
  created_at: string;
}

const Finances = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLedgerOpen, setAddLedgerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchTerm, typeFilter, startDate, endDate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ledger")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      setEntries(data || []);
      calculateSummary(data || []);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: LedgerEntry[]) => {
    const income = data
      .filter(e => e.type === "income")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const expenses = data
      .filter(e => e.type === "expense")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    setSummary({
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
    });
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        entry =>
          entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(entry => entry.type === typeFilter);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(entry => new Date(entry.date) <= new Date(endDate));
    }

    setFilteredEntries(filtered);
    calculateSummary(filtered);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Item", "Amount (KES)", "Quantity", "Notes"];
    const rows = filteredEntries.map(entry => [
      format(new Date(entry.date), "yyyy-MM-dd"),
      entry.type,
      entry.item,
      entry.amount.toString(),
      entry.quantity?.toString() || "",
      entry.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `finances_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Financial data exported successfully",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Track and analyze your farm finances</p>
        </div>
        <Button onClick={() => setAddLedgerOpen(true)}>
          <DollarSign className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              KES {summary.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredEntries.filter(e => e.type === "income").length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              KES {summary.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredEntries.filter(e => e.type === "expense").length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className={`h-4 w-4 ${summary.netProfit >= 0 ? "text-success" : "text-destructive"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              KES {summary.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((summary.totalIncome / (summary.totalExpenses || 1) - 1) * 100).toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Export
              </CardTitle>
              <CardDescription>Filter transactions and export data</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income Only</SelectItem>
              <SelectItem value="expense">Expense Only</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Showing {filteredEntries.length} of {entries.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading transactions...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No transactions found</p>
              <p className="text-sm">
                {entries.length === 0 
                  ? "Add your first transaction to start tracking finances" 
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(new Date(entry.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={entry.type === "income" ? "default" : "destructive"}
                          className={entry.type === "income" ? "bg-success hover:bg-success/90" : ""}
                        >
                          {entry.type === "income" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{entry.item}</TableCell>
                      <TableCell className={`text-right font-bold ${
                        entry.type === "income" ? "text-success" : "text-destructive"
                      }`}>
                        {entry.type === "income" ? "+" : "-"}KES {entry.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{entry.quantity || "-"}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {entry.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddLedgerDialog 
        open={addLedgerOpen} 
        onOpenChange={setAddLedgerOpen}
        onSuccess={fetchEntries}
      />
    </div>
  );
};

export default Finances;
