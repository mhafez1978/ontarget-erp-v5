"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
}

export function OnTargetERPSubscribers() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysCompanies = async () => {
    try {
      setError(null);
      const response = await fetch("/api/companies/today");

      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error("Failed to fetch today's companies:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysCompanies();
    // Refresh every 60 seconds
    const interval = setInterval(fetchTodaysCompanies, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Error: {error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTodaysCompanies}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies Directory ({companies.length})
            </CardTitle>
            <CardDescription>
              New companies registered on {new Date().toLocaleDateString()}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={fetchTodaysCompanies}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No companies found ...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Slogan/Description</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4" />
                      Members
                    </div>
                  </TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {company.description || "No description"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {company.ownerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {company.ownerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                        {company.memberCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(company.createdAt).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
