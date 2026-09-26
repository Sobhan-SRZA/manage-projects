"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "./ui/dialog";
import { createJobApplication } from "@/lib/actions/job-applications";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus } from "lucide-react";

interface CreateJobApplicationDialogProbs {
    columnId: string;
    boardId: string;
}

const INITIAL_FORM_DATA = {
    company: "",
    position: "",
    location: "",
    notes: "",
    salary: "",
    jobURL: "",
    tags: "",
    description: ""
};

export default function CreateJobApplicationDialog({ boardId, columnId }: CreateJobApplicationDialogProbs) {
    const [open, setOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const result = await createJobApplication({
                ...formData,
                columnId,
                boardId,
                tags: formData.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0),
            });

            if (!result.error) {
                setFormData(INITIAL_FORM_DATA);
                setOpen(false);
            } 
            
            else {
                console.error("Failed to create job: ", result.error);
            }
        } 
        
        catch (e) {
            console.error(e);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button
                    variant={"outline"}
                    className={"w-full mb-4 justify-start text-muted-foreground border-dashed border-2 hover:border-solid hover:bg-muted/50"}
                >
                    <Plus className="size-4 mr-2" />
                    Add Job
                </Button>
            </DialogTrigger>

            <DialogContent className={"maxw-2xl"}>
                <DialogHeader>
                    <DialogTitle>
                        Add Job Application
                    </DialogTitle>

                    <DialogDescription>
                        Track new job applications
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">
                                    Company *
                                </Label>

                                <Input
                                    id="company"
                                    required
                                    value={formData.company}
                                    onChange={(e) =>
                                        setFormData({ ...formData, company: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="position">
                                    Position *
                                </Label>

                                <Input
                                    id="position"
                                    required
                                    value={formData.position}
                                    onChange={(e) =>
                                        setFormData({ ...formData, position: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">
                                    Location
                                </Label>

                                <Input
                                    id="location"
                                    required
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({ ...formData, location: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="salary">
                                    Salary
                                </Label>

                                <Input
                                    id="salary"
                                    required
                                    placeholder="e.g., $100 - $150"
                                    value={formData.salary}
                                    onChange={(e) =>
                                        setFormData({ ...formData, salary: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jobURL">
                                Job URL
                            </Label>

                            <Input
                                id="jobURL"
                                placeholder="https://..."
                                value={formData.jobURL}
                                onChange={(e) =>
                                    setFormData({ ...formData, jobURL: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input
                                id="tags"
                                placeholder="React, Tailwind, High Pay"
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({ ...formData, tags: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                rows={3}
                                placeholder="Brief description of the role..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                rows={4}
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Add Application</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
