import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Label } from "./label";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

describe("ui smoke tests", () => {
  it("renders basic controls", () => {
    render(
      <div>
        <Button>Save</Button>
        <Input aria-label="name" defaultValue="Ram" />
        <Textarea aria-label="notes" defaultValue="Hello" />
        <Badge>Active</Badge>
      </div>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(screen.getByLabelText("name")).toBeTruthy();
    expect(screen.getByLabelText("notes")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("renders card, label, separator, skeleton and table", () => {
    render(
      <div>
        <Label htmlFor="x">Name</Label>
        <Input id="x" />
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Body</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
        <Separator />
        <Skeleton data-testid="sk" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Col</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>,
    );
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
    expect(screen.getByTestId("sk")).toBeTruthy();
    expect(screen.getByText("Cell")).toBeTruthy();
  });
});
