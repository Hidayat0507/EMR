"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from "firebase/firestore";
import { defaultSmartTextCommands } from "@/lib/smart-text";

type SmartTextSnippet = {
  id?: string;
  key: string;
  label: string;
  text: string;
  description?: string;
  isBuiltIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function SmartTextManager() {
  const [snippets, setSnippets] = useState<SmartTextSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<SmartTextSnippet | null>(null);
  const [formData, setFormData] = useState({ key: "", label: "", text: "" });
  const { toast } = useToast();

  useEffect(() => {
    loadSnippets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSnippets = async () => {
    try {
      // Load built-in commands
      const builtInSnippets: SmartTextSnippet[] = Object.values(defaultSmartTextCommands).map((cmd) => ({
        key: cmd.key,
        label: cmd.label,
        text: cmd.description || "Built-in command",
        description: cmd.description,
        isBuiltIn: true,
      }));

      // Load custom snippets from Firestore
      const q = query(collection(db, "smartText"), orderBy("key", "asc"));
      const snapshot = await getDocs(q);
      const customSnippets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isBuiltIn: false,
      })) as SmartTextSnippet[];

      // Combine and sort
      const allSnippets = [...builtInSnippets, ...customSnippets].sort((a, b) => 
        a.key.localeCompare(b.key)
      );
      
      setSnippets(allSnippets);
    } catch (error) {
      console.error("Error loading smart text snippets:", error);
      toast({
        title: "Error",
        description: "Failed to load smart text snippets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSnippet(null);
    setFormData({ key: "", label: "", text: "" });
    setOpen(true);
  };

  const handleEdit = (snippet: SmartTextSnippet) => {
    if (snippet.isBuiltIn) {
      toast({
        title: "Cannot Edit",
        description: "Built-in smart text commands cannot be edited",
        variant: "destructive",
      });
      return;
    }
    setEditingSnippet(snippet);
    setFormData({
      key: snippet.key,
      label: snippet.label,
      text: snippet.text,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.key.trim() || !formData.label.trim() || !formData.text.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Ensure key starts with a dot
    const normalizedKey = formData.key.startsWith(".") ? formData.key : `.${formData.key}`;

    try {
      if (editingSnippet?.id) {
        // Update existing
        await updateDoc(doc(db, "smartText", editingSnippet.id), {
          key: normalizedKey,
          label: formData.label,
          text: formData.text,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: "Success",
          description: "Smart text updated successfully",
        });
      } else {
        // Create new
        await addDoc(collection(db, "smartText"), {
          key: normalizedKey,
          label: formData.label,
          text: formData.text,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: "Success",
          description: "Smart text created successfully",
        });
      }
      setOpen(false);
      loadSnippets();
    } catch (error) {
      console.error("Error saving smart text:", error);
      toast({
        title: "Error",
        description: "Failed to save smart text",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (snippet: SmartTextSnippet) => {
    if (snippet.isBuiltIn) {
      toast({
        title: "Cannot Delete",
        description: "Built-in smart text commands cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    if (!snippet.id) return;
    if (!confirm(`Delete smart text "${snippet.label}"?`)) return;

    try {
      await deleteDoc(doc(db, "smartText", snippet.id));
      toast({
        title: "Success",
        description: "Smart text deleted successfully",
      });
      loadSnippets();
    } catch (error) {
      console.error("Error deleting smart text:", error);
      toast({
        title: "Error",
        description: "Failed to delete smart text",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Create custom text shortcuts that you can insert by typing the key (e.g., .greeting) in clinical notes.
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Smart Text
        </Button>
      </div>

      {snippets.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No smart text snippets yet. Click &quot;Add Smart Text&quot; to create one.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Key</TableHead>
                <TableHead className="w-[200px]">Label</TableHead>
                <TableHead>Text</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snippets.map((snippet) => (
                <TableRow key={snippet.id || snippet.key}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {snippet.key}
                      {snippet.isBuiltIn && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell>{snippet.label}</TableCell>
                  <TableCell className="max-w-md truncate text-sm text-muted-foreground">{snippet.text}</TableCell>
                  <TableCell>
                    {!snippet.isBuiltIn && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(snippet)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(snippet)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {snippet.isBuiltIn && (
                      <span className="text-xs text-muted-foreground">Built-in</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSnippet ? "Edit Smart Text" : "Add Smart Text"}</DialogTitle>
            <DialogDescription>
              Create a text shortcut that can be inserted into clinical notes by typing the key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                placeholder=".greeting"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The shortcut to trigger this text (e.g., .greeting). Will auto-add dot if missing.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="Patient Greeting"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">A friendly name for this smart text.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Text</Label>
              <Textarea
                id="text"
                placeholder="Enter the text that will be inserted..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">The text that will be inserted when you type the key.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

