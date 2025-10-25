"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NameInputModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNameSubmit: (name: string) => void
}

export default function NameInputModal({ open, onOpenChange, onNameSubmit }: NameInputModalProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters")
      return
    }
    onNameSubmit(name.trim())
    setName("")
    setError("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to PrepO</DialogTitle>
          <DialogDescription>Please enter your name to get started</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              onKeyDown={handleKeyDown}
              className="w-full"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
