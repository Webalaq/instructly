"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Student } from "@/lib/schemas/student";
import StudentDialog from "./StudentDialog";
import { softDeleteStudent } from "./actions";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "test_booked", label: "Test Booked" },
  { key: "passed", label: "Passed" },
  { key: "inactive", label: "Inactive" },
] as const;

const STATUS_VARIANT: Record<Student["status"], "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  test_booked: "secondary",
  passed: "outline",
  inactive: "destructive",
};

const STATUS_LABEL: Record<Student["status"], string> = {
  active: "Active",
  test_booked: "Test Booked",
  passed: "Passed",
  inactive: "Inactive",
};

export default function StudentTable({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = students.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch =
      !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <StudentDialog
          mode="add"
          trigger={<Button>Add student</Button>}
        />
      </div>

      <div className="flex gap-1 rounded-lg border border-input p-1">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? students.length
              : students.filter((s) => s.status === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          {students.length === 0
            ? "No students yet. Add your first student to get started."
            : "No students match your filters."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Theory</TableHead>
                <TableHead>Test Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.email ?? "—"}</TableCell>
                  <TableCell>{student.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[student.status]}>
                      {STATUS_LABEL[student.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.theory_passed ? "Yes" : "No"}</TableCell>
                  <TableCell>{student.test_date ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <StudentDialog
                        mode="edit"
                        student={student}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        }
                      />
                      {student.status !== "inactive" && (
                        <form action={async () => { await softDeleteStudent(student.id); }}>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Archive
                          </Button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
