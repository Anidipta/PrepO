"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RoleSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleSelect: (role: "mentor" | "mentee") => void
}

export default function RoleSelectionModal({ open, onOpenChange, onRoleSelect }: RoleSelectionModalProps) {
  const handleRoleSelect = async (role: "mentor" | "mentee") => {
    await onRoleSelect(role)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Role</DialogTitle>
          <DialogDescription>Select whether you want to be a mentor or mentee</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            onClick={() => handleRoleSelect("mentee")}
            variant="outline"
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">👨‍🎓</span>
            <span className="font-semibold">Mentee</span>
            <span className="text-xs text-muted-foreground">Learn and earn rewards</span>
          </Button>
          <Button
            onClick={() => handleRoleSelect("mentor")}
            variant="outline"
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-2xl">👨‍🏫</span>
            <span className="font-semibold">Mentor</span>
            <span className="text-xs text-muted-foreground">Create courses and earn</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
